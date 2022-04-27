import ERWeakLink
import XPC

public typealias xpc_pipe_t = xpc_object_t

extension ERWeakLinkHandle {
    static var xpc: ERWeakLinkHandle {
        "/usr/lib/system/libxpc.dylib"
    }
}

public let xpc_pipe_create_from_port: (@convention(c) (_ port: mach_port_t, _ flags: UInt64) -> xpc_pipe_t)?  = ERWeakLinkSymbol("xpc_pipe_create_from_port", .xpc)

public let xpc_pipe_create: (@convention(c) (_ name: UnsafePointer<CChar>, _ flags: UInt64) -> xpc_pipe_t)?  = ERWeakLinkSymbol("xpc_pipe_create", .xpc)

public let bootstrap_register: (
    @convention(c) (
        _ bs_port: mach_port_t,
        _ name: UnsafePointer<CChar>,
        _ port: mach_port_t
    ) -> kern_return_t
)? = ERWeakLinkSymbol("bootstrap_register", .xpc)

public let bootstrap_look_up: (
    @convention(c) (
        _ bs_port: mach_port_t,
        _ name: UnsafePointer<CChar>,
        _ port: UnsafeMutablePointer<mach_port_t>
    ) -> kern_return_t
)? = ERWeakLinkSymbol("bootstrap_look_up", .xpc)

public let xpc_pipe_receive: (
    @convention(c) (
        _ p: mach_port_t,
        _ message: UnsafeMutablePointer<xpc_object_t>,
        _ flags: UInt64
    ) -> CInt
)? = ERWeakLinkSymbol("xpc_pipe_receive", .xpc)

public let xpc_pipe_routine_async: (
    @convention(c) (
        _ pipe: xpc_pipe_t,
        _ message: xpc_object_t,
        _ replyp: mach_port_t
    ) -> CInt
)? = ERWeakLinkSymbol("xpc_pipe_routine_async", .xpc)

public let xpc_pipe_try_receive: (
    @convention(c) (
        _ pipe: mach_port_t,
        _ message: UnsafeMutablePointer<xpc_object_t>,
        _ recvp: UnsafeMutablePointer<mach_port_t>,
        _ callout: @convention(c) (UnsafeMutablePointer<mach_msg_header_t>, UnsafeMutablePointer<mach_msg_header_t>) -> boolean_t,
        _ maxmsgsz: size_t,
        _ flags: UInt64
    ) -> CInt
)? = ERWeakLinkSymbol("xpc_pipe_try_receive", .xpc)

public let xpc_dictionary_set_mach_send: (
    @convention(c) (
        _ dictionary: xpc_object_t,
        _ key: UnsafePointer<CChar>,
        _ port: mach_port_t
    ) -> ()
)? = ERWeakLinkSymbol("xpc_dictionary_set_mach_send", .xpc)

public let xpc_dictionary_copy_mach_send: (
    @convention(c) (
        _ dictionary: xpc_object_t,
        _ key: UnsafePointer<CChar>
    ) -> mach_port_t
)? = ERWeakLinkSymbol("xpc_dictionary_copy_mach_send", .xpc)

public let xpc_pipe_invalidate: (@convention(c) (_ pipe: xpc_pipe_t) -> ())?  = ERWeakLinkSymbol("xpc_pipe_invalidate", .xpc)

public let xpc_dictionary_get_audit_token: (
    @convention(c) (
        _ dict: xpc_object_t,
        _ audit: UnsafeMutablePointer<audit_token_t>
    ) -> ()
)? = ERWeakLinkSymbol("xpc_dictionary_get_audit_token", .xpc)

public let MACH_PORT_TYPE_SEND_RIGHTS: UInt32 = 65536

public func mach_port_send_valid(_ port: mach_port_t) -> Bool {
    var type: mach_port_type_t = 0
    
    if mach_port_type(mach_task_self_, port, &type) != KERN_SUCCESS || (0 == (type & MACH_PORT_TYPE_SEND_RIGHTS)) {
        return false
    }
    
    return true
}
