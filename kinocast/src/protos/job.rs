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
//! Generated file from `job.proto`

/// Generated files are compatible only with the same version
/// of protobuf runtime.
// const _PROTOBUF_VERSION_CHECK: () = ::protobuf::VERSION_2_28_0;

#[derive(PartialEq,Clone,Default)]
pub struct RevokeMessagesBySignerJobPayload {
    // message fields
    pub fid: u32,
    pub signer: ::std::vec::Vec<u8>,
    // special fields
    pub unknown_fields: ::protobuf::UnknownFields,
    pub cached_size: ::protobuf::CachedSize,
}

impl<'a> ::std::default::Default for &'a RevokeMessagesBySignerJobPayload {
    fn default() -> &'a RevokeMessagesBySignerJobPayload {
        <RevokeMessagesBySignerJobPayload as ::protobuf::Message>::default_instance()
    }
}

impl RevokeMessagesBySignerJobPayload {
    pub fn new() -> RevokeMessagesBySignerJobPayload {
        ::std::default::Default::default()
    }

    // uint32 fid = 1;


    pub fn get_fid(&self) -> u32 {
        self.fid
    }
    pub fn clear_fid(&mut self) {
        self.fid = 0;
    }

    // Param is passed by value, moved
    pub fn set_fid(&mut self, v: u32) {
        self.fid = v;
    }

    // bytes signer = 2;


    pub fn get_signer(&self) -> &[u8] {
        &self.signer
    }
    pub fn clear_signer(&mut self) {
        self.signer.clear();
    }

    // Param is passed by value, moved
    pub fn set_signer(&mut self, v: ::std::vec::Vec<u8>) {
        self.signer = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_signer(&mut self) -> &mut ::std::vec::Vec<u8> {
        &mut self.signer
    }

    // Take field
    pub fn take_signer(&mut self) -> ::std::vec::Vec<u8> {
        ::std::mem::replace(&mut self.signer, ::std::vec::Vec::new())
    }
}

impl ::protobuf::Message for RevokeMessagesBySignerJobPayload {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    if wire_type != ::protobuf::wire_format::WireTypeVarint {
                        return ::std::result::Result::Err(::protobuf::rt::unexpected_wire_type(wire_type));
                    }
                    let tmp = is.read_uint32()?;
                    self.fid = tmp;
                },
                2 => {
                    ::protobuf::rt::read_singular_proto3_bytes_into(wire_type, is, &mut self.signer)?;
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
        if self.fid != 0 {
            my_size += ::protobuf::rt::value_size(1, self.fid, ::protobuf::wire_format::WireTypeVarint);
        }
        if !self.signer.is_empty() {
            my_size += ::protobuf::rt::bytes_size(2, &self.signer);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        if self.fid != 0 {
            os.write_uint32(1, self.fid)?;
        }
        if !self.signer.is_empty() {
            os.write_bytes(2, &self.signer)?;
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

    fn new() -> RevokeMessagesBySignerJobPayload {
        RevokeMessagesBySignerJobPayload::new()
    }

    fn descriptor_static() -> &'static ::protobuf::reflect::MessageDescriptor {
        static descriptor: ::protobuf::rt::LazyV2<::protobuf::reflect::MessageDescriptor> = ::protobuf::rt::LazyV2::INIT;
        descriptor.get(|| {
            let mut fields = ::std::vec::Vec::new();
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeUint32>(
                "fid",
                |m: &RevokeMessagesBySignerJobPayload| { &m.fid },
                |m: &mut RevokeMessagesBySignerJobPayload| { &mut m.fid },
            ));
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeBytes>(
                "signer",
                |m: &RevokeMessagesBySignerJobPayload| { &m.signer },
                |m: &mut RevokeMessagesBySignerJobPayload| { &mut m.signer },
            ));
            ::protobuf::reflect::MessageDescriptor::new_pb_name::<RevokeMessagesBySignerJobPayload>(
                "RevokeMessagesBySignerJobPayload",
                fields,
                file_descriptor_proto()
            )
        })
    }

    fn default_instance() -> &'static RevokeMessagesBySignerJobPayload {
        static instance: ::protobuf::rt::LazyV2<RevokeMessagesBySignerJobPayload> = ::protobuf::rt::LazyV2::INIT;
        instance.get(RevokeMessagesBySignerJobPayload::new)
    }
}

impl ::protobuf::Clear for RevokeMessagesBySignerJobPayload {
    fn clear(&mut self) {
        self.fid = 0;
        self.signer.clear();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for RevokeMessagesBySignerJobPayload {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for RevokeMessagesBySignerJobPayload {
    fn as_ref(&self) -> ::protobuf::reflect::ReflectValueRef {
        ::protobuf::reflect::ReflectValueRef::Message(self)
    }
}

#[derive(PartialEq,Clone,Default)]
pub struct UpdateNameRegistryEventExpiryJobPayload {
    // message fields
    pub fname: ::std::vec::Vec<u8>,
    // special fields
    pub unknown_fields: ::protobuf::UnknownFields,
    pub cached_size: ::protobuf::CachedSize,
}

impl<'a> ::std::default::Default for &'a UpdateNameRegistryEventExpiryJobPayload {
    fn default() -> &'a UpdateNameRegistryEventExpiryJobPayload {
        <UpdateNameRegistryEventExpiryJobPayload as ::protobuf::Message>::default_instance()
    }
}

impl UpdateNameRegistryEventExpiryJobPayload {
    pub fn new() -> UpdateNameRegistryEventExpiryJobPayload {
        ::std::default::Default::default()
    }

    // bytes fname = 1;


    pub fn get_fname(&self) -> &[u8] {
        &self.fname
    }
    pub fn clear_fname(&mut self) {
        self.fname.clear();
    }

    // Param is passed by value, moved
    pub fn set_fname(&mut self, v: ::std::vec::Vec<u8>) {
        self.fname = v;
    }

    // Mutable pointer to the field.
    // If field is not initialized, it is initialized with default value first.
    pub fn mut_fname(&mut self) -> &mut ::std::vec::Vec<u8> {
        &mut self.fname
    }

    // Take field
    pub fn take_fname(&mut self) -> ::std::vec::Vec<u8> {
        ::std::mem::replace(&mut self.fname, ::std::vec::Vec::new())
    }
}

impl ::protobuf::Message for UpdateNameRegistryEventExpiryJobPayload {
    fn is_initialized(&self) -> bool {
        true
    }

    fn merge_from(&mut self, is: &mut ::protobuf::CodedInputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        while !is.eof()? {
            let (field_number, wire_type) = is.read_tag_unpack()?;
            match field_number {
                1 => {
                    ::protobuf::rt::read_singular_proto3_bytes_into(wire_type, is, &mut self.fname)?;
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
        if !self.fname.is_empty() {
            my_size += ::protobuf::rt::bytes_size(1, &self.fname);
        }
        my_size += ::protobuf::rt::unknown_fields_size(self.get_unknown_fields());
        self.cached_size.set(my_size);
        my_size
    }

    fn write_to_with_cached_sizes(&self, os: &mut ::protobuf::CodedOutputStream<'_>) -> ::protobuf::ProtobufResult<()> {
        if !self.fname.is_empty() {
            os.write_bytes(1, &self.fname)?;
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

    fn new() -> UpdateNameRegistryEventExpiryJobPayload {
        UpdateNameRegistryEventExpiryJobPayload::new()
    }

    fn descriptor_static() -> &'static ::protobuf::reflect::MessageDescriptor {
        static descriptor: ::protobuf::rt::LazyV2<::protobuf::reflect::MessageDescriptor> = ::protobuf::rt::LazyV2::INIT;
        descriptor.get(|| {
            let mut fields = ::std::vec::Vec::new();
            fields.push(::protobuf::reflect::accessor::make_simple_field_accessor::<_, ::protobuf::types::ProtobufTypeBytes>(
                "fname",
                |m: &UpdateNameRegistryEventExpiryJobPayload| { &m.fname },
                |m: &mut UpdateNameRegistryEventExpiryJobPayload| { &mut m.fname },
            ));
            ::protobuf::reflect::MessageDescriptor::new_pb_name::<UpdateNameRegistryEventExpiryJobPayload>(
                "UpdateNameRegistryEventExpiryJobPayload",
                fields,
                file_descriptor_proto()
            )
        })
    }

    fn default_instance() -> &'static UpdateNameRegistryEventExpiryJobPayload {
        static instance: ::protobuf::rt::LazyV2<UpdateNameRegistryEventExpiryJobPayload> = ::protobuf::rt::LazyV2::INIT;
        instance.get(UpdateNameRegistryEventExpiryJobPayload::new)
    }
}

impl ::protobuf::Clear for UpdateNameRegistryEventExpiryJobPayload {
    fn clear(&mut self) {
        self.fname.clear();
        self.unknown_fields.clear();
    }
}

impl ::std::fmt::Debug for UpdateNameRegistryEventExpiryJobPayload {
    fn fmt(&self, f: &mut ::std::fmt::Formatter<'_>) -> ::std::fmt::Result {
        ::protobuf::text_format::fmt(self, f)
    }
}

impl ::protobuf::reflect::ProtobufValue for UpdateNameRegistryEventExpiryJobPayload {
    fn as_ref(&self) -> ::protobuf::reflect::ReflectValueRef {
        ::protobuf::reflect::ReflectValueRef::Message(self)
    }
}

static file_descriptor_proto_data: &'static [u8] = b"\
    \n\tjob.proto\"R\n\x20RevokeMessagesBySignerJobPayload\x12\x12\n\x03fid\
    \x18\x01\x20\x01(\rR\x03fidB\0\x12\x18\n\x06signer\x18\x02\x20\x01(\x0cR\
    \x06signerB\0:\0\"C\n'UpdateNameRegistryEventExpiryJobPayload\x12\x16\n\
    \x05fname\x18\x01\x20\x01(\x0cR\x05fnameB\0:\0B\0b\x06proto3\
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