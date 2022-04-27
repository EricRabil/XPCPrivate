/**
 I am lazy and so I wrote a parser for the function signature part of swift and translate these to become weak links 
 */

const raw = `@_silgen_name("xpc_pipe_create_from_port")
func xpc_pipe_create_from_port(_ port: mach_port_t, _ flags: UInt64) -> xpc_pipe_t

@_silgen_name("xpc_pipe_create")
func xpc_pipe_create(_ name: UnsafePointer<CChar>, _ flags: UInt64) -> xpc_pipe_t

@_silgen_name("bootstrap_register")
func bootstrap_register(_ bs_port: mach_port_t, _ name: UnsafePointer<CChar>, _ port: mach_port_t) -> kern_return_t

@_silgen_name("bootstrap_look_up")
func bootstrap_look_up(_ bs_port: mach_port_t, _ name: UnsafePointer<CChar>, _ port: UnsafeMutablePointer<mach_port_t>) -> kern_return_t

@_silgen_name("xpc_pipe_receive")
func xpc_pipe_receive(_ p: mach_port_t, _ message: UnsafeMutablePointer<xpc_object_t>, _ flags: UInt64) -> CInt

@_silgen_name("xpc_pipe_routine_async")
func xpc_pipe_routine_async(_ pipe: xpc_pipe_t, _ message: xpc_object_t, _ replyp: mach_port_t) -> CInt

@_silgen_name("xpc_pipe_try_receive")
func xpc_pipe_try_receive(_ pipe: mach_port_t, _ message: UnsafeMutablePointer<xpc_object_t>, _ recvp: UnsafeMutablePointer<mach_port_t>, _ callout: @convention(c) (UnsafeMutablePointer<mach_msg_header_t>, UnsafeMutablePointer<mach_msg_header_t>) -> boolean_t, _ maxmsgsz: size_t, _ flags: UInt64) -> CInt

@_silgen_name("xpc_dictionary_set_mach_send")
public func xpc_dictionary_set_mach_send(_ dictionary: xpc_object_t, _ key: UnsafePointer<CChar>, _ port: mach_port_t)

@_silgen_name("xpc_dictionary_copy_mach_send")
public func xpc_dictionary_copy_mach_send(_ dictionary: xpc_object_t, _ key: UnsafePointer<CChar>) -> mach_port_t

@_silgen_name("xpc_pipe_invalidate")
func xpc_pipe_invalidate(_ pipe: xpc_pipe_t)

@_silgen_name("xpc_dictionary_get_audit_token")
func xpc_dictionary_get_audit_token(_ dict: xpc_object_t, _ audit: UnsafeMutablePointer<audit_token_t>)`

const parts = raw.split("\n\n");

const weakLinkHandleExpr = ".xpc"

const weaks = [];

for (const part of parts) {
    let [silgen, rawSignature] = part.split("\n");
    silgen = silgen.slice(silgen.indexOf('"') + 1, -2);
    const returnTokenIndex = rawSignature.lastIndexOf("->");
    let argumentsString, returnString;
    if (returnTokenIndex >= 0) {
        argumentsString = rawSignature.slice(rawSignature.indexOf('('), returnTokenIndex).trim();
        returnString = rawSignature.slice(returnTokenIndex + 2).trim();
    } else {
        argumentsString = rawSignature;
        returnString = "()";
    }
    while (true) {
        if (argumentsString.startsWith("public ")) {
            argumentsString = argumentsString.slice("public ".length);
            continue;
        }
        if (argumentsString.startsWith("func ")) {
            argumentsString = argumentsString.slice("func ".length);
            continue;
        }
        if (argumentsString.startsWith(silgen)) {
            argumentsString = argumentsString.slice(silgen.length).trimStart();
            continue;
        }
        break;
    }
    if (argumentsString.length > 48) {
        class ParsingContext {
            /**
             * 
             * @param {string} name 
             * @param {any} data 
             * @param {ParsingContext} parent 
             */
            constructor(name, data, parent = this) {
                this.parent = parent;
                this.data = data;
                this.name = name;
                this.children = [];
            }

            toJSON() {
                return {
                    name: this.name,
                    data: this.data,
                    children: this.children.map(child => child.toJSON())
                }
            }

            get index() {
                return this.parent.children.indexOf(this);
            }
            
            extractSource(string) {
                return string.slice(this.data.startIndex, this.data.endIndex + 1);
            }

            enter(child, data) {
                const node = new ParsingContext(child, data, this);
                this.children.push(node);
                return node;
            }

            exit(assertSelf, mergeData) {
                if (typeof assertSelf === "string" && this.name !== assertSelf) {
                    console.error(new Error("Syntax error"), {
                        assertSelf,
                        parent: this.parent,
                        this: this
                    });
                }
                if (typeof mergeData === "object") {
                    this.data = Object.assign({}, this.data ?? {}, mergeData);
                }
                return this.parent;
            }
        }

        let context = new ParsingContext("root");

        /**
         * 
         * @param {ParsingContext} context 
         */
        function formatContext(context) {
            let text = "";
            
            return text;
        }

        let nonsenseIndex = -1, endOfNonsense = -1;
        for (let index = 0; index < argumentsString.length; index++) {
            const preprocessContext = () => {
                switch (context.name) {
                    case 'nonsense':
                        context.data.nonsense = argumentsString.slice(context.data.startIndex, context.data.endIndex);
                        context = context.exit();
                        break;
                    case 'whitespace':
                        context = context.exit();
                        break;
                }
                return context;
            }
            
            switch (argumentsString[index]) {
                case ':':
                    context = preprocessContext().enter('colon').exit();
                    if (context.name === 'array') {
                        context.name = 'dictionary';
                    }
                    continue;
                case '(':
                    context = preprocessContext().enter('parenthesis', { startIndex: index });
                    continue;
                case ')':
                    context = preprocessContext().exit('parenthesis', { endIndex: index + 1 });
                    continue;
                case '[':
                    context = preprocessContext().enter('array', { startIndex: index });
                    continue;
                case ']':
                    context = preprocessContext().exit('array', { endIndex: index + 1 });
                    continue;
                case '-':
                    if (context.name !== "nonsense") {
                        if (argumentsString[index + 1] === '>') {
                            context = preprocessContext().enter('arrow', { startIndex: index, endIndex: index + 2 }).exit();
                            index = index + 1;
                            continue;
                        }
                    }
                    break;
                case ',':
                    context = preprocessContext().enter('comma', { startIndex: index, endIndex: index + 1 }).exit();
                    continue;
                case '_':
                    if (context.name !== "nonsense") {
                        if (argumentsString[index + 1] === ' ') {
                            context = preprocessContext().enter('unnamed', { startIndex: index, endIndex: index + 1 }).exit();
                        }
                        continue;
                    }
                    break;
                default:
                    break;
            }
            switch (context.name) {
                case 'whitespace':
                    if (argumentsString[index] !== ' ') {
                        context = context.exit().enter('nonsense', { startIndex: index });
                    }
                    break;
                case 'nonsense':
                    break;
                default:
                    context = context.enter(argumentsString[index] === ' ' ? 'whitespace' : 'nonsense', { startIndex: index });
                    break;
            }
            context.data.endIndex = index + 1;
        }

        /**
         * 
         * @param {ParsingContext} context 
         */
        const tryParsingArgumentsSyntax = (context) => {
            if (context.name !== "parenthesis") {
                throw new Error("Expected parent to be parenthesis, got " + context.name);
            }
            const parameters = [];
            let commaIndex;
            const nextCommaIndex = () => context.children.findIndex((child, curChildIndex) => child.name === "comma" && (isNaN(commaIndex) ? true : curChildIndex > commaIndex));
            while (commaIndex !== -1) {
                const prevCommaIndex = commaIndex;
                commaIndex = nextCommaIndex();
                if (isNaN(prevCommaIndex) && isNaN(commaIndex)) {
                    parameters.push(...context.children)
                    break;
                } else if (isNaN(prevCommaIndex) && !isNaN(commaIndex)) {
                    parameters.push(context.children.slice(0, commaIndex));
                } else if (!isNaN(prevCommaIndex) && !isNaN(commaIndex)) {
                    if (commaIndex === -1) {
                        let string = argumentsString.slice()
//                        string[prevCommaIndex] = '\x1b[31m\,\x1b[0m';
                        const { startIndex, endIndex } = context.children[prevCommaIndex].data;
//                        console.log(string.slice(0,startIndex) +  '\x1b[31m\,\x1b[0m' + string.slice(endIndex))
//                        console.log(context.children.slice(prevCommaIndex + 1));
                        parameters.push(context.children.slice(prevCommaIndex + 1));
                    } else {
                        parameters.push(context.children.slice(prevCommaIndex + 1, commaIndex));
                    }
                } else if (commaIndex === -1) {
                    parameters.push(context.children.slice(prevCommaIndex + 1));
                }
            }
            
            const parsedParameters = [];
            for (const parameter of parameters) {
                let externalParameterName;
                let internalParameterName;
                let parameterType;
                for (let i = 0; i < parameter.length; i++) {
                    const piece = parameter[i];
                    switch (piece.name) {
                    case "unnamed":
                        if (!externalParameterName && !internalParameterName && !parameterType) {
                            externalParameterName = piece;
                            continue;
                        }
                        console.error(new Error("Illegal usage of unnamed"), {
                            piece, parameter, parameters, context
                        });
                        return [];
                    case "nonsense":
                        if (!externalParameterName) {
                            externalParameterName = piece;
                            continue;
                        }
                        if (!internalParameterName) {
                            internalParameterName = piece;
                            continue;
                        }
                        if (!parameterType) {
                            if (piece.data?.nonsense === 'UInt64') {
                                
//                                console.log({
//                                    piece, parameter: parameter.slice(i), i
//                                })
//                                parameterType = parameter.slice(i)
//                                console.log(parameterType)
                            }
                            parameterType = parameter.slice(i);
                            continue;
                        }
                        continue;
                    default:
//                        console.dir(piece);
                    }
                }
                parsedParameters.push({ externalParameterName, internalParameterName, parameterType });
            }
            return parsedParameters;
        }

        // console.dir(context, { depth: 10 });
        const parsedParameters = tryParsingArgumentsSyntax(context.children[0]);
        const parameterSlices = parsedParameters.map(param => argumentsString.slice(param.externalParameterName.data.startIndex, param.parameterType.slice(-1)[0].data.endIndex));
//        console.log(context.children[0].children)
        const typeSignature = `@convention(c) (${parameterSlices.length ? '\n\t' : ''}${''
                                              
                                              }${parameterSlices.join(',\n\t')}${''
                                              }${parameterSlices.length ? '\n' : ''}) -> ${returnString}`;
        const arrowIndex = typeSignature.lastIndexOf('\n) ->');
        
        const declaration = `public let ${silgen}: (\n\t${typeSignature.slice(0,arrowIndex).replaceAll('\t', '\t\t')}\n\t${typeSignature.slice(arrowIndex + 1)}\n)? = ERWeakLinkSymbol("${silgen}", ${weakLinkHandleExpr})`;
        console.log(declaration)
//        console.dir(JSON.parse(JSON.stringify()), { depth: 10 })
        // console.dir(tryParsingArgumentsSyntax(context.children[0]), { depth: 5 })
    } else {
        console.log([`public let ${silgen}:`, `(@convention(c) ${argumentsString} -> ${returnString})?`, ` = ERWeakLinkSymbol("${silgen}", ${weakLinkHandleExpr})`].join(' '))
    }
    if (parts.indexOf(part) === parts.length - 1) {
        continue
    }
    console.log()
    // console.log({ silgen, rawSignature, returnTokenIndex, argumentsString, returnString, weak })
}
// console.log(weaks.join("\n"));
