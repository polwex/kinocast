import Modal from "../components/Modal";
import { ReactElement, useEffect, useState } from "react";
import { create } from "zustand";
import {
  checkFid,
  checkSigners,
  createPc,
  createWallet,
  fetchEns,
  fnameFlow,
  getLocalSigner,
  getWalletSigner,
  phraseClient,
  phraseWallet,
  registerApp,
  registerFlow,
  setKeysFlow,
} from "../logic/chain/clients";
import { addressToProfile, fidToProfile } from "../logic/fetch/comp";
import spinner from "../assets/icons/ring-spin.svg";
import type { WalletClient } from "viem";
import type { Fid, HexString, UserProfile } from "../logic/types/farcaster";
import { sendUserData, setOnBackend } from "../logic/fetch/kinode";
import type { PublicClient } from "../logic/chain/clients";
import { JSX } from "react";
import { fetchPubkey } from "../logic/fetch/kinode";
import useGlobalState from "../logic/state/state";
import "../index.css";
import "./modals.css";
import { checkFidFname, checkFnameAvailable } from "../logic/fetch/warpcast";
import { RECOVERY_ADDRESS } from "../logic/constants";

type PageState = {
  el: JSX.Element | null,
  setEl: (el: JSX.Element | null) => void,
  setLoading: (loading: string) => void,
  loading: string;
  error: string,
  setError: (error: string) => void,
  wc: WalletClient | null,
  setWc: () => Promise<void>;
  pc: PublicClient,
  // setWc: (wc: WalletClient) => void
};
const pageState = create<PageState>((set, get) => ({
  el: null,
  setEl: (el) => set({ el }),
  loading: "",
  setLoading: (loading) => set({ loading }),
  error: "",
  setError: (error) => set({ error, loading: "" }),
  wc: null,
  setWc: async () => {
    const wc = await createWallet();
    set({ wc });
  },
  pc: createPc(),
  // setWc: (wc) => set({ wc })
}));


function LoginFlow() {
  
  const { loading, setLoading, el, setEl, pc, wc, setWc } = pageState();
  const [waiting, setWaiting] = useState(false);
  async function connect() {
    setWaiting(true)
    setLoading("Connecting to your wallet");
    await setWc();
    setLoading("");
  }
  const no = () => setEl(<Register />)
  useEffect(() => {
    if (wc?.account) {
      setEl(<WalletConnected />)
    }
    else if (waiting) setEl(<WalletNotConnected />)
  }, [wc, waiting])

  const Welcome = (
    <div id="welcome-msg">
      <h1 className="tc">Welcome to Kinocast!</h1>
      <p>
        {" "}
        Kinocast is a new client for Farcaster, the decentralized social network
        built on Ethereum.
      </p>
      <p>
        Kinocast is built on Kinode OS, a personal server platform born to make
        decentralized apps real through tight integration of on-chain and
        off-chain environments.
      </p>
      <p>Let's set you up on Farcaster right away.</p>
      <div className="row even">
        <button onClick={connect}>Connect Wallet</button>
      </div>
    </div>
  );

  return (
    <Modal closable={false} >
      {loading
        ? <div>
          <img src={spinner} id="login-spinner" className="spinner agc" />
          <p className="ac" id="loading-msg">{loading}</p>
        </div>
        // : el ? el : <ChooseFname fid={502763} />
        : el ? el : Welcome
      }
    </Modal>
  )
}


function WalletConnected() {
  const { setEl, setLoading, pc, wc, setWc } = pageState();
  async function left() {
    setLoading("Querying the blockchain for your account");
    const fid = await branchOnFid(pc, wc!.account!.address!);
    if (fid === 0) {
      setLoading("")
      setEl(<NoFid />)
    }
    else {
      const { user, signingKey } = await fidData(fid);
      setLoading("")
      setEl(
        <Confirm
          fid={fid}
          user={user}
          pubkey={signingKey}
          phrase={null}
        />

      )
    }
  }

  const right = () => setEl(<PhraseInput />)
  return (
    <div id="farcaster-login">
      <h3 className="tc">Import your Farcaster ID</h3>
      <p className="tc">
        You are connected with wallet {wc!.account!.address!}
      </p>
      <p className="tc">
        Do you want to look for your Farcaster account on that address? You can also change addresses or input a seed phrase for a wallet you exported from Warpcast.
      </p>
      <div className="row g2 flexc">
        <button onClick={left}>Use Current Address</button>
        <button onClick={setWc}>Change Address</button>
        <button onClick={right}>Input Seed Phrase</button>
      </div>
    </div>
  );
}

async function branchOnFid(pc: PublicClient, address: string) {
  const bfid = await checkFid(pc, address as any);
  const f = Number(bfid);
  return f
}
async function fidData(f: number) {
  const res = await fidToProfile(f);
  const signers = await checkSigners(f);
  const user = "error" in res ? null : res.ok;
  const signingKey = "error" in signers ? null : signers.ok;
  return { user, signingKey };
}

function WalletNotConnected() {
  const { setEl, setWc } = pageState();
  async function left() {
    await setWc();
  }
  const right = () => setEl(<PhraseInput />)
  return (
    <div id="farcaster-login">
      <h3 className="tc">Import your Farcaster ID</h3>
      <p className="tc">
        You can connect your wallet or input the seed phrase of the wallet which
        owns your Farcaster ID.{" "}
      </p>
      <p className="tc">
        If you registered with Warpcast you can export your seed phrase from the
        Warpcast mobile app
      </p>
      <div className="row g2 flexc">
        <button onClick={left}>Connect Wallet</button>
        <button onClick={right}>Input Seed Phrase</button>
      </div>
    </div>
  );
}

function PhraseInput({ cancel }: any) {
  const { setEl, error, setError, setLoading } = pageState();
  // TODO delete
  const [input, setInput] = useState("");
  function onChange(e: React.FormEvent<HTMLTextAreaElement>) {
    setError("");
    setInput(e.currentTarget.value);
  }
  async function submit() {
    const wallet = phraseWallet(input);
    if ("error" in wallet) setError("Invalid seed phrase");
    else {
      setLoading("Searching for your user profile");
      const profile = await addressToProfile(wallet.ok.address);
      if ("error" in profile) {
        setError("Couldn't find a Farcaster ID under this wallet");
        setLoading("");
      } else {
        setLoading("Fetching your signing keys");
        const signers = await checkSigners(profile.ok.fid);
        setLoading("");
        const key = "error" in signers ? null : signers.ok;
        setEl(
          <Confirm
            fid={profile.ok.fid}
            user={profile.ok}
            phrase={input}
            pubkey={key}
          />,
        );
      }
    }
  }
  return (
    <div id="phrase-input" className="all-c">
      <h3 className="tc">Import your Farcaster ID Seed Phrase</h3>
      <textarea value={input} onChange={onChange}></textarea>
      <div className="buttons row g2">
        <button onClick={submit}>Submit</button>
        <button onClick={cancel}>Cancel</button>
      </div>
      {error && <p className="error tc">{error}</p>}
    </div>
  );
}

function Confirm({
  fid,
  user,
  pubkey,
  phrase,
}: {
  fid: number;
  user: UserProfile | null;
  pubkey: HexString | null;
  phrase: any;
}) {
  const { setEl } = pageState();
  const { init } = useGlobalState();
  function right() {
    setEl(null)
  }
  async function fidGood() {
    if (pubkey) {
      await setOnBackend(fid);
      // TODO edit profile
      if (!user) setEl(<EditProfile fid={fid} />);
      if (!user?.username) {
        const fres = await checkFidFname(fid);
        if (fres.length === 0)
          setEl(<ChooseFname fid={fid} />)
        else {
          const fname = fres[0].username;
          const sres = await sendUserData(fname, 6);
          if (sres) setEl(<Final fname={fname} />)
        }
      } else await init();
    } else {
      setEl(
        <SetKeys
          fid={fid}
          phrase={phrase}
          user={user}
        />,
      );
    }
  }

  return (
    <div className="" id="confirm-login">
      <h3 className="tc">Confirm</h3>
      {user ? (
        <>
          <ProfileCard user={user} />
          <p className="tc">uid: {fid}</p>
          <p className="tc">Is this your account?</p>
        </>
      ) : (<>
        <p className="tc">
          We found a Farcaster under your address account with uid: {fid} but no
          profile set. </p>

        <p className="tc">
          Do you want to use this account?
        </p>
      </>
      )}
      {pubkey && (
        <p className="tc">
          It appears you already have this account associated with your Kinode
          too
        </p>
      )}
      <div className="buttons row even">
        <button onClick={fidGood}>Yes</button>
        <button onClick={right}>Back</button>
      </div>
    </div>
  );
}


function SetKeys({ fid, phrase, user }: { fid: number, phrase: any, user: UserProfile | null }) {
  const { error, setEl, setLoading, setError, pc, wc } = pageState();
  async function postKeys() {
    setLoading("Checking with your Kinode");
    const pubkey = await fetchPubkey();
    if ("error" in pubkey) return setError(pubkey.error);
    const client: WalletClient = phrase ? phraseClient(phrase) : wc!;
    const { signer, addr } = phrase
      ? getLocalSigner(phrase)
      : getWalletSigner(client);
    const tx = await setKeysFlow(
      pc,
      client,
      addr,
      pubkey.ok,
      signer,
    );
    setLoading("");
    if ("error" in tx) setError(tx.error);
    else {
      if (user)
        setEl(<Final fname={user.username} />);
      else setEl(<EditProfile fid={fid} />);
    }
  }

  return (
    <div className="" id="setting-keys">
      <h3 className="tc">Setting Signing Key</h3>
      <p className="tc">
        Your Farcaster id has been saved to your Kinode
      </p>
      <p className="tc">
        We will now associate your Kinocast cryptographic key with your Farcaster
        account</p>
      {!phrase ? (
        <p className="tc">
          Please click the button and confirm the transaction in your wallet
        </p>
      ) : (
        <p className="tc">Please click the button to start</p>
      )}
      <button className="bc" onClick={postKeys}>
        Set Keys
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function ProfileCard({ user }: { user: UserProfile }) {
  const { displayname, username, bio, pfp, url } = user;
  return (
    <div className="profile card row">
      <div id="left">
        <img src={pfp} />
      </div>
      <div id="right">
        <div id="names">
          <div className="bold">{displayname}</div>
          <div className="weak">@{username}</div>
        </div>
        <div>{bio}</div>
        <div>{url}</div>
      </div>
    </div>
  );
}

function Register() {
  const { setEl, setWc, pc, wc, setLoading, setError } = pageState();
  const right = () => setEl(null);

  async function register() {
    setLoading("Registering new ID in the Farcaster Smart Contract")
    const res = await registerFlow(pc, wc!, RECOVERY_ADDRESS);
    if ("ok" in res) await branch()
    else setEl(<Error s="Something went wrong, please try again later" />)
  }
  async function branch(count = 0) {
    if (count > 5) {
      setEl(<Error s="Timeout finding your new ID" />)
      return
    }
    setLoading("Registration successful, checking for ID");
    const fid = await branchOnFid(pc, wc!.account!.address);
    if (fid === 0) setTimeout(() => branch(count + 1), 3000);
    else await susumu(fid)
  }
  async function susumu(fid: number) {
    const { user, signingKey } = await fidData(fid);
    setLoading("")
    setEl(
      <Confirm
        fid={fid}
        user={user}
        pubkey={signingKey}
        phrase={null}
      />
    )
  }
  return (
    <div>
      <h3 className="tc">Create Account</h3>
      <p className="tc">
        You can create a Farcaster account right here on Kinocast.
      </p>
      <p className="tc">
        Farcaster accounts are registered on the Optimism L2 of Ethereum. Click
        the button below to connect your wallet and register an ID.
      </p>
      <div className="buttons row g2 flexc">
        <button onClick={register}>Register</button>
        <button onClick={right}>Go back</button>
      </div>
    </div>
  );
}


function NoFid() {
  const { pc, wc, setWc, setEl, setLoading } = pageState();
  const adr = wc!.account!.address! as any;
  const left = () => setEl(<Register />)

  async function middle() {
    await setWc();
    // setEl(<WalletConnected />)
  }
  const right = () => setEl(null);
  console.log(adr, "address");
  return (
    <div id="address">
      <>
        <h3 className="tc">Connect Wallet</h3>
        <p className="tc">
          Couldn't find any Farcaster account on this address.
        </p>
        <p className="tc address">{adr}</p>
        <p className="tc">Do you want to create a new account, or change addresses?</p>
        <div className="buttons row even">
          <button onClick={left}>Create Account</button>
          <button onClick={middle}>Change Address</button>
          <button onClick={right}>Back</button>
        </div>
      </>
    </div>
  );
}
function ChooseFname({ fid }: { fid: Fid }) {
  const { wc, error, setError, setLoading, setEl } = pageState();
  const [ens, setEns] = useState("");
  async function checkEns(){
    const addr = wc!.account!.address;
    const res = await fetchEns(addr);
    if (res) setEns(res);
  }
  useEffect(() => {
    checkEns()
    
  },[])
  async function submit() {
    setLoading("Checking if name is available");
    const available = await checkFnameAvailable(input);
    if (available.length > 0) {
      setLoading("")
      setError("name already taken")
    }
    else {
      const res = await fnameFlow(input, fid, wc!);
      if ("ok" in res) {
        await sendUserData(input, 6);
        setEl(<Final fname={input} />);
      }
    }
  }
  function onchange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setInput(e.target.value);
  }
  const [input, setInput] = useState("");
  return (
    <div id="set-fname">
      <h3 className="tc">Choose a Username</h3>
      <p className="tc">
        Your Farcaster account with uid {fid} was registered successfully, but in order to participate fully you will need to register a username.
      </p>
      {ens && <p>It appears you are the owner of an ENS Domain, you could register that as your Farcaster username if you want </p>}
      <p className="tc">
        Input your choice below and click submit to register it. You will need to sign the request with your wallet.
      </p>
      <div id="fname-form">
        <input type="text" placeholder="username"
          value={input}
          onChange={onchange}
        />
        <button onClick={submit}>Submit</button>
        {error && <p className="error tc">{error}</p>}
      </div>


    </div>)
}

function EditProfile({ fid }: { fid: Fid }) {
  const { setEl } = pageState();
  async function checkf() {
    const res = await checkFidFname(fid);
    if (res.length === 0) setEl(<ChooseFname fid={fid} />)
  }
  useEffect(() => {
    checkf()

  }, [])
  const [name, setName] = useState("");
  const [username, setUname] = useState("");
  const [pfp, setPic] = useState("");
  const [bio, setBio] = useState("");
  const [url, setURL] = useState("");
  async function save() {
    const prof = { fid, pfp, bio, url, name, username };
    if (pfp !== "") sendUserData(pfp, 1);
    if (name !== "") sendUserData(name, 2);
    if (bio !== "") sendUserData(bio, 3);
    if (url !== "") sendUserData(url, 5);
    if (username !== "") sendUserData(username, 6);
    // saveit(prof);
  }
  return (
    <div id="edit-profile">
      <h3 className="tc">Edit your Profile</h3>
      <p className="tc">
        Your Farcaster account with uid {fid} was successfully saved on your Kinode.
      </p>
      <p className="tc">
        Let's make a profile now so people can know more about you.
      </p>
      <div id="form" className="profile card row">
        <div id="left">
          <img src={pfp} />
          <input
            type="text"
            placeholder="profile pic url"
            value={pfp}
            onChange={(e) => setPic(e.target.value)}
          />
        </div>
        <div id="right">
          <div id="names">
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUname(e.target.value)}
            />
          </div>
          <input
            type="text"
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setURL(e.target.value)}
          />
        </div>
      </div>
      <button className="bc" onClick={save}>
        Save
      </button>
    </div>
  );
}

function Final({ fname }: { fname: string }) {
  const { init } = useGlobalState();
  return (
    <div className="blocks">
      <h3 className="tc">Success!</h3>
      <p>Your have successfully loaded your Farcaster account {fname} through Kinode.</p>
      <p>You are fully logged in now. Click on the button to start casting.</p>
      <button className="bc" onClick={init}>
        Let's go
      </button>
    </div>
  );

}
function Error({ s }: { s: string }) {
  const { setEl } = pageState();
  const back = () => setEl(null);
  return (
    <div className="" id="error">
      <h3 className="tc">Error</h3>
      <p className="tc">{s}</p>
      <p className="tc">Click below to try again</p>
      <button onClick={back}>Go back</button>
    </div>
  )
}
export default LoginFlow
