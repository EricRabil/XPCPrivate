import XCTest
@testable import XPCPrivate

final class XPCPrivateTests: XCTestCase {
    func testExample() throws {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct
        // results.
        
        XCTAssertNotNil(xpc_pipe_create_from_port)
        XCTAssertNotNil(xpc_pipe_create)
        XCTAssertNotNil(bootstrap_register)
        XCTAssertNotNil(bootstrap_look_up)
        XCTAssertNotNil(xpc_pipe_receive)
        XCTAssertNotNil(xpc_pipe_routine_async)
        XCTAssertNotNil(xpc_pipe_try_receive)
        XCTAssertNotNil(xpc_dictionary_set_mach_send)
        XCTAssertNotNil(xpc_dictionary_copy_mach_send)
        XCTAssertNotNil(xpc_pipe_invalidate)
        XCTAssertNotNil(xpc_dictionary_get_audit_token)
    }
}
