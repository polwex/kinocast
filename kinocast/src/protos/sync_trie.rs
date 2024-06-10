// This file is generated by rust-protobuf 2.28.0. Do not edit
// @generated

// https://github.com/rust-lang/rust-clippy/issues/702
#![allow(unknown_lints)]
#![allow(clippy::all)]

#![allow(unused_attributes)]
#![cfg_attr(rustfmt, rustfmt::skip)]

#![allow(box_pointers)]
#![allow(dead_code)]
#![allow(missing_docs)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(non_upper_case_globals)]
#![allow(trivial_casts)]
#![allow(unused_imports)]
#![allow(unused_results)]
//! Generated file from `sync_trie.proto`

/// Generated files are compatible only with the same version
/// of protobuf runtime.
// const _PROTOBUF_VERSION_CHECK: () = ::protobuf::VERSION_2_28_0;

#[derive(PartialEq,Clone,Default)]
pub struct DbTrieNode {
    // message fields
    pub key: ::std::vec::Vec<u8>,
    pub childChars: ::std::vec::Vec<u32>,
    pub items: u32,
    pub hash: ::std::vec::Vec<u8>,
    // special fields
    pub unknown_fields: ::protobuf::UnknownFields,
    pub cached_size: ::protobuf::CachedSize,
}

impl<'a> ::std::default::Default for &'a DbTrieNode {
    fn default() -> &'a DbTrieNode {
        <DbTrieNode as ::protobuf::Message>::default_instance()
    }
}

impl DbTrieNode {
    pub fn new() -> DbTrieNode {
        ::std::default::Default::default()
    }

    // bytes key = 1;


    pub fn get_key(&self) -> &[u8] {
        &self.key
    }
    pub fn clear_key(&mut self) {
        self.key.clear();
    }

    // Param is passed by value, moved
    pub fn set_key(&mut self, v: ::std::vec::Vec<u8>) {
        self.key = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_key(&mut self) -> &mut ::std::vec::Vec<u8> {
        &mut self.key
    }

    // Take field
    pub fn take_key(&mut self) -> ::std::vec::Vec<u8> {
        ::std::mem::replace(&mut self.key, ::std::vec::Vec::new())
    }

    // repeated uint32 childChars = 2;


    pub fn get_childChars(&self) -> &[u32] {
        &self.childChars
    }
    pub fn clear_childChars(&mut self) {
        self.childChars.clear();
    }

    // Param is passed by value, moved
    pub fn set_childChars(&mut self, v: ::std::vec::Vec<u32>) {
        self.childChars = v;
    }

    // Mutable pointer to the field.
    pub fn mut_childChars(&mut self) -> &mut ::std::vec::Vec<u32> {
        &mut self.childChars
    }

    // Take field
    pub fn take_childChars(&mut self) -> ::std::vec::Vec<u32> {
        ::std::mem::replace(&mut self.childChars, ::std::vec::Vec::new())
    }

    // uint32 items = 3;


    pub fn get_items(&self) -> u32 {
        self.items
    }
    pub fn clear_items(&mut self) {
        self.items = 0;
    }

    // Param is passed by value, moved
    pub fn set_items(&mut self, v: u32) {
        self.items = v;
    }

    // bytes hash = 4;


    pub fn get_hash(&self) -> &[u8] {
        &self.hash
    }
    pub fn clear_hash(&mut self) {
        self.hash.clear();
    }

    // Param is passed by value, moved
    pub fn set_hash(&mut self, v: ::std::vec::Vec<u8>) {
        self.hash = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_hash(&mut self) -> &mut ::std::vec::Vec<u8> {
        &mut self.hash
    }

    // Take field
    pub fn take_hash(&mut self) -> ::std::vec::Vec<u8> {
        ::std::mem::replace(&mut self.hash, ::std::vec::Vec::new())
    }
}

impl ::protobuf::Message for DbTrieNode {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_bytes_into(wire_type, is, &mut self.key)?;
                },
                2 => {
                    ::protobuf::rt::read_repeated_uint32_into(wire_type, is, &mut self.childChars)?;
                },
                3 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint32()?;
                    self.items = tmp;
                },
                4 => {
                    ::protobuf::rt::read_singular_proto3_bytes_into(wire_type, is, &mut self.hash)?;
                },
                _ => {
                    ::protobuf::rt::read_unknown_or_skip_group(field_number, wire_type, is, self.mut_unknown_fields())?;
                },
            };
        }
        ::std::result::Result::Ok(())
    }

    // Compute sizes of nested messages
    #[allow(unused_variables)]
    fn compute_size(&self) -> u32 {
        let mut my_size = 0;
        if !self.key.is_empty() {
            my_size += ::protobuf::rt::bytes_size(1, &self.key);
        }
        for value in &self.childChars {
            my_size += ::protobuf::rt::value_size(2, *value, ::protobuf::wire_format::WireTypeVarint);
        };
        if self.items != 0 {
            my_size += ::protobuf::rt::value_size(3, self.items, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.hash.is_empty() {
            my_size += ::protobuf::rt::bytes_size(4, &self.hash);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        if !self.key.is_empty() {
            os.write_bytes(1, &self.key)?;
        }
        for v in &self.childChars {
            os.write_uint32(2, *v)?;
        };
        if self.items != 0 {
            os.write_uint32(3, self.items)?;
        }
        if !self.hash.is_empty() {
            os.write_bytes(4, &self.hash)?;
        }
        os.write_unknown_fields(self.get_unknown_fields())?;
        ::std::result::Result::Ok(())
    }

    fn get_cached_size(&self) -> u32 {
        self.cached_size.get()
    }

    fn get_unknown_fields(&self) -> &::protobuf::UnknownFields {
        &self.unknown_fields
    }

    fn mut_unknown_fields(&mut self) -> &mut ::protobuf::UnknownFields {
        &mut self.unknown_fields
    }

    fn as_any(&self) -> &dyn (::std::any::Any) {
        self as &dyn (::std::any::Any)
    }
    fn as_any_mut(&mut self) -> &mut dyn (::std::any::Any) {
        self as &mut dyn (::std::any::Any)
    }
    fn into_any(self: ::std::boxed::Box<Self>) -> ::std::boxed::Box<dyn (::std::any::Any)> {
        self
    }

    fn descriptor(&self) -> &'static ::protobuf::reflect::MessageDescriptor {
        Self::descriptor_static()
    }

    fn new() -> DbTrieNode {
        DbTrieNode::new()
    }

    fn descriptor_static() -> &'static ::protobuf::reflect::MessageDescriptor {
        static descriptor: ::protobuf::rt::LazyV2<::protobuf::reflect::MessageDescriptor> = ::protobuf::rt::LazyV2::INIT;
        descriptor.get(|| {
            let mut fields = ::std::vec::Vec::new();
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeBytes>(
                "key",
                |m: &DbTrieNode| { &m.key },
                |m: &mut DbTrieNode| { &mut m.key },
            ));
            fields.push(::protobuf::reflect::accessor::make_vec_accessor::<_, ::protobuf::types::ProtobufTypeUint32>(
                "childChars",
                |m: &DbTrieNode| { &m.childChars },
                |m: &mut DbTrieNode| { &mut m.childChars },
            ));
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint32>(
                "items",
                |m: &DbTrieNode| { &m.items },
                |m: &mut DbTrieNode| { &mut m.items },
            ));
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeBytes>(
                "hash",
                |m: &DbTrieNode| { &m.hash },
                |m: &mut DbTrieNode| { &mut m.hash },
            ));
            ::protobuf::reflect::MessageDescriptor::new_pb_name::<DbTrieNode>(
                "DbTrieNode",
                fields,
                file_descriptor_proto()
            )
        })
    }

    fn default_instance() -> &'static DbTrieNode {
        static instance: ::protobuf::rt::LazyV2<DbTrieNode> = ::protobuf::rt::LazyV2::INIT;
        instance.get(DbTrieNode::new)
    }
}

impl ::protobuf::Clear for DbTrieNode {
    fn clear(&mut self) {
        self.key.clear();
        self.childChars.clear();
        self.items = 0;
        self.hash.clear();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for DbTrieNode {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for DbTrieNode {
    fn as_ref(&self) -> ::protobuf::reflect::ReflectValueRef {
        ::protobuf::reflect::ReflectValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\x0fsync_trie.proto\"r\n\nDbTrieNode\x12\x12\n\x03key\x18\x01\x20\x01(\
    \x0cR\x03keyB\0\x12\x20\n\nchildChars\x18\x02\x20\x03(\rR\nchildCharsB\0\
    \x12\x16\n\x05items\x18\x03\x20\x01(\rR\x05itemsB\0\x12\x14\n\x04hash\
    \x18\x04\x20\x01(\x0cR\x04hashB\0:\0B\0b\x06proto3\
";

static file_descriptor_proto_lazy: ::protobuf::rt::LazyV2<::protobuf::descriptor::FileDescriptorProto> = ::protobuf::rt::LazyV2::INIT;

fn parse_descriptor_proto() -> ::protobuf::descriptor::FileDescriptorProto {
    ::protobuf::Message::parse_from_bytes(file_descriptor_proto_data).unwrap()
}

pub fn file_descriptor_proto() -> &'static ::protobuf::descriptor::FileDescriptorProto {
    file_descriptor_proto_lazy.get(|| {
        parse_descriptor_proto()
    })
}
