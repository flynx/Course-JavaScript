/**********************************************************************
* 
*
*
**********************************************************************/


/*********************************************************************/

function run(context){

	var stack = context.stack
	stack = stack == null ? [] : stack
	context.stack = stack

	var ns = context.ns

	while(context.code.length > 0){

		var cur = context.code.splice(0, 1)[0]

		// exit...
		if(typeof(cur) == typeof('abc') && cur == '_exit'){
			return context

		// word
		} else if(typeof(cur) == typeof('abc') && cur in ns){
			var word = ns[cur]
			// low-level word...
			if(typeof(word) == typeof(function(){})){
				var res = ns[cur](context)

			// hi-level word...
			} else if(typeof(word) == typeof([]) && word.constructor.name == 'Array'){
				// XXX add isolation with a continuation...
				context.code.splice.apply(context.code, [0, 0].concat(word))
				var res = null

			// variable...
			} else {
				res = word
			}

			if(res != null){
				context.stack.push(res)
			}

		// everything else...
		} else {
			context.stack.push(cur)
		}
	}

	return context
}

var SPLITTER = /\s*\([^\)]*\)\s*|\s*--.*[\n$]|\s*(".*")\s*|\s*('.*')\s*|\s+/m


// pre-processor namespace...
var PRE_NAMESPACE = {
	// XXX use the real reader...
	// block...
	// syntax: [ ... ]
	'[': function(context){
		var block = []
		var code = context.code
		var cur = code.splice(0, 1)[0]
		while(cur != ']' && code.length > 0){
			if(cur == '['){
				cur = this['['](context)
			}
			block.push(cur)
			cur = code.splice(0, 1)[0]
		}
		if(code.length == 0 && cur != ']'){
			console.error('Did not find expected "]".')
		} 
		return block
	},
	'macro:': function(context){
		var ident = context.code.splice(0, 1)
		var cur = context.code.splice(0, 1)

		// as we do not have blocks yet we need to manually collect one ;)
		if(cur[0] == '['){
			cur = [ this['['](context) ]
		}

		this[ident] = cur[0]
	},
}


// main namespace...
var NAMESPACE = {
	// constants...
	'true': true,
	'false': false,
	// this is mutable, so we'll need to create a new instance each time
	'[]': function(){ return [] }, 

	'nop': function(){}, 

	// XXX experimental...
	// flip the code and stack...
	// ... -- ...
	'_flip': function(context){
		var stack = context.stack
		context.stack = context.code.reverse()
		context.code = stack.reverse()
	},

	// swap heads of stack and code
	// ... ns nc -- ...
	'_swapN': function(context){ 
		var c = context.stack.pop()
		var s = context.stack.pop()
		var l = context.stack.length

		// get the stack/code sections to swap...
		var s_c = context.stack.splice(l-s, l)
		var c_c = context.code.splice(0, c)
		var l = context.stack.length

		// we need to pad e_c and c_c to requested length...
		s_c = s_c.length < s ? s_c.concat(Array( s - s_c.length )) : s_c
		c_c = c_c.length < c ? c_c.concat(Array( c - c_c.length )) : c_c

		// XXX we also need to shove something more sensible in the 
		// 		padding that undefined...

		context.code.splice.apply(context.code, [0, 0].concat(s_c))
		context.stack.splice.apply(context.stack, [l, 0].concat(c_c))
	},

	// encapsulate stack to a block...
	// ... -- [ ... ]
	's2b': function(context){
		context.stack = [ context.stack ]
	},
	// expand block to stack... 
	// NOTE: this will append the block contents to stack, w.o. replacing 
	// 		stack contents. this is different to _s2b
	// ... [ ... ] -- ... ...
	'b2s': function(context){
		var c = context.stack.pop()
		context.stack.splice.apply(context.stack, [context.stack.length, 0].concat(c))
	},
	'print': function(context){
		console.log('>>>', context.stack[context.stack.length-1])
	},

	// turn a sting into a lexical list...
	// c -- b
	// XXX BUG see code...
	'lex': function(context){
		code = context.stack.pop()
		if(typeof(code) == typeof('abc')){
			// XXX BUG: '"aaa" "bbb"' translates to ['"aaa"', '" "', '"bbb"'] 
			// 		i.e. quotes w/o whitespace are eaten...
			if(/^(['"]).*\1$/m.test(code)){
				code = code.split(/^(['"])(.*)\1$/m)[2]
			}
			var res = []
			code = code
				// split by strings whitespace and block comments...
				.split(SPLITTER)
				// parse numbers...
				.map(function(e){ 
					// numbers...
					if(/^[-+]?[0-9]+\.[0-9]+$/.test(e)){
						e = parseFloat(e)
					} else if(/^[-+]?[0-9]+$/.test(e)){
						e = parseInt(e)
					}
					return e
				})
				// remove undefined groups...
				.filter(function(e){ 
					// NOTE: in JS 0 == '' is true ;)
					return e !== undefined && e !== ''
				})
		}
		return code
	},
	// pre-process a lexical list...
	// a -- b
	'prep': function(context){
		var code = context.stack.pop()

		return run({
			stack: [],
			code: code,
			ns: context.pre_ns,
			pre_ns: {},
		}).stack
	},

	// word definition...
	// syntax: :: <ident> <block>
	// --
	'::': function(context){
		var ident = context.code.splice(0, 1)
		var cur = context.code.splice(0, 1)

		this[ident] = cur[0]
	},

	// s c -- s
	'_exec': function(context){
		// block...
		var b = context.stack.pop()
		if(typeof(b) == typeof([]) && b.constructor.name == 'Array'){
			b = b.slice()
		} else {
			b = [ b ]
		}
		// stack...
		var s = context.stack.pop()
		var res = run({
			stack: s,
			code: b,
			// NOTE: this can have side-effects on the context...
			ns: context.ns,
			pre_ns: context.pre_ns
		}).stack
		return res
	},
	// quote - push the next elem as-is to stack...
	// -- x
	'\\': function(context){
		var code = context.code
		return code.splice(0, 1)[0] 
	},

	// comparisons and logic...
	// a b -- c
	'and': function(context){
		var b = context.stack.pop()
		var a = context.stack.pop()
		if(a){
			return b
		} else {
			return a
		}
	},
	// a b -- c
	'or': function(context){
		var b = context.stack.pop()
		var a = context.stack.pop()
		if(a){
			return a
		} else {
			return b
		}
	},
	// x -- b
	'not': function(context){
		return !context.stack.pop()
	},
	// a b -- c
	'gt': function(context){
		return context.stack.pop() < context.stack.pop()
	},
	// a b -- c
	'eq': function(context){
		return context.stack.pop() == context.stack.pop()
	},

	// stack operations...
	// ... x -- x ...
	'rot': function(context){
		context.stack.splice(0, 0, context.stack.pop())
	},
	// x ... -- ... x
	'tor': function(context){
		context.stack.push(context.stack.shift())
	},
	// a b -- b a
	'swap': function(context){
		return context.stack.splice(context.stack.length-2, 1)[0]
	},
	// x -- x x
	'dup': function(context){
		return context.stack[context.stack.length-1]
	},
	// x --
	'drop': function(context){
		context.stack.pop()
	},

	// basic number operations...
	// a -- b
	'isNumber': function(context){
		return typeof(context.stack.pop()) == typeof(123)
	},
	// a b -- c
	'add': function(context){
		return context.stack.pop() + context.stack.pop()
	},
	'sub': function(context){
		return - context.stack.pop() + context.stack.pop()
	},
	'mul': function(context){
		return context.stack.pop() * context.stack.pop()
	},
	'div': function(context){
		return context.stack.pop() / context.stack.pop()
	},

	// block/list operations...
	'isBlock': function(context){
		var e = context.stack.pop()
		return typeof(e) == typeof([]) && e.constructor.name == 'Array'
	},
	// b n -- b e
	'at': function(context){
		var i = context.stack.pop()
		if(i < 0){
			var l = context.stack[context.stack.length-1]
			return l[l.length + i]
		}
		return context.stack[context.stack.length-1][i]
	},
	// b e n -- b
	'to': function(context){
		var i = context.stack.pop()
		var e = context.stack.pop()
		if(i < 0){
			var l = context.stack[context.stack.length-1]
			l[l.length + i] = e
		} else {
			context.stack[context.stack.length-1][i] = e
		}
	},
	// b e n -- b
	'before': function(context){
		var i = context.stack.pop()
		var e = context.stack.pop()
		if(i < 0){
			var l = context.stack[context.stack.length-1]
			l.splice(l.length + i + 1, 0, e)
		} else {
			context.stack[context.stack.length-1].splice(i, 0, e)
		}
	},
	// b -- b e
	'pop': function(context){
		return context.stack[context.stack.length-1].pop()
	},
	// b -- b l
	'len': function(context){
		return context.stack[context.stack.length-1].length
	},
	// b c -- b
	'each': function(context){
		var c = context.stack.pop()
		var b = context.stack[context.stack.length-1]
		for(var i=0; i < b.length; i++){
			// exec block in a separate context...
			var res = run({
				stack: [b[i], c],
				code: ['exec'],
				// NOTE: this can have side-effects on the context...
				ns: context.ns
			}).stack
			var l = res.length
			if(l == 0){
				b.splice(i, 1)
				i--
			} else {
				b.splice.apply(b, [i, 1].concat(res))
				i += l - 1
			}
		}
	},
}


var BOOTSTRAP = '\n'+
'-- To expalin stack and code effect some commands have will use a not so\n'+
'-- traditional notation, the "|" will indicate the split between the stack\n'+
'-- and code, here is a representation:\n'+
'--\n'+
'-- 	[ .. STACK .. ] <-- runtime -- [ .. CODE .. ]\n'+
'--\n'+
'--\n'+
'-- And here is the new notation representing the states while we run through a\n'+
'-- word, "add" in this case:\n'+
'--\n'+
'--		stack   code\n'+
'--		      | 1 2 add\n'+
'--		    1 | 2 add\n'+
'--		  1 2 | add\n'+
'--		1 2 [add]			(a)\n'+
'--		    3 |				(b)\n'+
'--\n'+
'-- With stack effect is written like this:\n'+
'--\n'+
'--		( a b -- c )\n'+
'--\n'+
'--\n'+
'-- In traditional stack effect notation we indicate the difference between\n'+
'-- states (a) ans (b), but when we need to explain something like _swap we\'ll\n'+
'-- also affect the code, so the process will go like this (expanding "+" word):\n'+
'--\n'+
'--		stack   code\n'+
'--		      | 1 + 2\n'+
'--		    1 | + 2\n'+
'--		   1 [+] 2			(a)\n'+
'--		    3 |				(b)\n'+
'--\n'+
'-- So here what "+" actually does is the difference between steps (a) and (b)\n'+
'-- thus the notation:\n'+
'--\n'+
'--		( a | b -- c |  )\n'+
'--\n'+
'--\n'+
'-- Just for illustration, here is how _swap ( a | b -- b | a ) works:\n'+
'--\n'+
'--		stack   code\n'+
'--		      | a _swap b\n'+
'--		    a | _swap b\n'+
'--		 a [_swap] b			(a)\n'+
'--		    b | a			(b)\n'+
'--\n'+
'--\n'+
':: _swap ( x | y -- y | x ) [ 1 1 _swapN ]\n'+
':: _push ( x |  -- | x ) [ 0 _swapN ]\n'+
':: _pull (  | x -- x |  ) [ 0 swap _swapN ]\n'+
'\n'+
':: exec ( b -- ... ) [ s2b pop _exec b2s ]\n'+
':: eval ( c -- ... ) [ lex prep exec ]\n'+
'-- like exec but will run a block in current context...\n'+
':: b2c [ len rot b2s tor 0 _swapN ]\n'+
'\n'+
':: . ( x -- ) [ print drop ]\n'+
'\n'+
':: swap2 ( a _ b -- b _ a ) [ swap rot swap tor swap ]\n'+
':: dup2 ( a b -- a b a b ) [ dup swap2 dup rot swap2 tor swap ]\n'+
'\n'+
':: isT ( a -- b ) [ not not true eq ]\n'+
':: isF ( a -- b ) [ not isT ]\n'+
//'\n'+
//'-- this defines a classic [ cond ] [ A ] [ B ] if word... (a bit too polish IMHO)\n'+
//':: if ( cond a b -- ... ) [ rot rot exec isT tor and tor or exec ]\n'+
'\n'+
'-- helpers for the ternary operator...\n'+
'-- run then block and drop \'else B\' if it exists...\n'+
':: _run_then ( a x | -- ... | x  )\n'+
'	( a else | b -- ... | )\n'+
'		[ \\ exec swap dup \\ else eq [ (drop else) drop \\ drop _swap 6 ] and\n'+
'				[ (run as-is) 1 _push 4 ] or\n'+
'				b2s 0 _swapN ]\n'+
'-- if \'else B\' exists, run it, else cleanup...\n'+
':: _run_else ( a | --  | a  )\n'+
'	( b else | b -- ... | )\n'+
'		[ drop dup \\ else eq [ drop \\ exec _swap 4 ] and\n'+
'				[ 1 _push 2 ] or\n'+
'				b2s 0 _swapN ]\n'+
'-- NOTE: this may actually have one of three stack effects...\n'+
':: ? ( c | a -- | )\n'+
'	( c | a -- ... | )\n'+
'	( c | a else b -- ... | )\n'+
'		[ exec [ _run_then 1 ] and [ swap _run_else 2 ] or b2s 2 _swapN ]\n'+
'\n'+
'\n'+
'-- list/block 2\'nd gen stuff...\n'+
':: push ( b e i -- b ) [ -1 before ]\n'+
'\n'+
'\n'+
'-- experimental...\n'+
'-- NOTE: these are at this point stupid and do not support priorities or grouping...\n'+
'-- NOTE: these have both stack and code effect, in genera the operations are of \n'+
'--		the form: A op B\n'+
':: + ( a | b -- c |  ) [ \\ add _swap ]\n'+
':: - ( a | b -- c |  ) [ \\ sub _swap ]\n'+
':: * ( a | b -- c |  ) [ \\ mul _swap ]\n'+
':: / ( a | b -- c |  ) [ \\ div _swap ]\n'+
'\n'+
':: == ( a | b -- c |  ) [ \\ eq _swap ]\n'+
':: > ( a | b -- c |  ) [ \\ gt _swap ]\n'+
'\n'+
'\n'+
'-- this is here for devel use only\n'+
':: _clear ( ... -- ) [ s2b drop ] \n'+
':: _stack_size ( -- l ) [ s2b len swap b2s tor ] \n'+
'\n'+
'\n'+
'-- tests and examples...\n'+
':: hi ( -- ) [ "Hello World!" print drop ]\n'+
//'-- NOTE: nop at the end is a stub to fix a bug in ? else ...\n'+
//':: ! ( a -- b ) [ [ dup 1 eq not ] ? [ dup 1 sub ! mul ] nop ]\n'+
':: ! ( a -- b ) [ [ dup 1 eq not ] ? [ dup 1 sub ! mul ] ]\n'+
':: range ( n -- b ) [\n'+
'		-- initial state...\n'+
'		[ dup isNumber ] ? \n'+
'			[ [] swap ]\n'+
'		-- get first elem...\n'+
'		else\n'+
'			[ 0 at ]\n'+
'		-- we got to the end...\n'+
'		[ dup 0 eq ] ? \n'+
'			[ drop ]\n'+
'		-- dec push new and continue...\n'+
'		else\n'+
'			[ 1 sub 0 before range ] ]\n'+
':: range2 ( n s -- b )\n'+
'		[ swap range swap [] swap push \\ * 0 before each ]\n'+
'\n'+
''


var STARTUP = [[], BOOTSTRAP, 'lex', 'prep', '_exec', 'drop']


// build bootstrap...
var CONTEXT = {
	stack: [],
	code: STARTUP.slice(),
	ns: NAMESPACE,
	pre_ns: PRE_NAMESPACE,
}


// run bootstrap...
run(CONTEXT)


// convenience...
function _slang(code, context){
	context = context == null ? CONTEXT : context

	context.code = code
	return run(context).stack
}


function slang(code, context){
	context = context == null ? CONTEXT : context

	if(typeof(code) == typeof('abc')){
		code = [ '"'+code+'"', 'lex', 'prep', 'exec' ]
	} else {
		code = [ [code], 'b2s', 'prep', 'exec' ]
	}

	context.code = code
	return run(context).stack
}



/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
