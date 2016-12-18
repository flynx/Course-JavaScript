/**********************************************************************
* 
*
*
**********************************************************************/

/* XXX for some odd reason this breaks the interpreter...
Array.prototype.toString = function(){
	return '[ ' + this.join(', ') + ' ]'
}
*/


/*********************************************************************/

function run(context){

	context.stack = context.stack == null ? [] : context.stack

	while(context.code.length > 0){

		var cur = context.code.splice(0, 1)[0]

		// exit...
		if(typeof(cur) == typeof('abc') && cur == '_exit'){
			return context

		// word
		} else if(typeof(cur) == typeof('abc') && cur in context.ns){
			var word = context.ns[cur]
			// low-level word...
			if(typeof(word) == typeof(function(){})){
				var res = context.ns[cur](context)

			// hi-level word...
			} else if(typeof(word) == typeof([]) && word && word.constructor.name == 'Array'){
				// XXX add isolation with a continuation...
				context.code.splice.apply(context.code, [0, 0].concat(word))
				var res = undefined

			// variable...
			} else {
				var res = word
			}

			if(res !== undefined){
				context.stack.push(res)
			}

		// everything else...
		} else {
			context.stack.push(cur)
		}
	}

	return context
}

// XXX make this add '\n' / EOL words to the stream...
//var SPLITTER = /\s*\([^\)]*\)\s*|\s*--.*[\n$]|\s*"([^"]*)"\s*|\s*'([^']*)'\s*|\s+/m
var SPLITTER = RegExp([
			// terms to keep in the stream...
			/*'('+[
				'\\n',
				'--',
			].join('|')+')',*/

			// comments...
			'\\s*\\([^\\)]*\\)\\s*',
			'\\s*--.*[\\n$]',

			// quoted strings...
			'\\s*"([^"]*)"\\s*',
			"\\s*'([^']*)'\\s*",

			// quote...
			'\\s*(\\\\)',

			// whitespace...
			'\\s+',
		].join('|'),
		'm')


// pre-processor namespace...
var PRE_NAMESPACE = {
	// comment...
	// syntax: -- ... \n
	//
	// drop everything until '\n'
	//
	// NOTE: this depends on explicit '\n' words...
	'--': function(context){
		var res = ['--']
		var code = context.code
		var cur = code.splice(0, 1)[0]
		res.push(cur)
		while(cur != '\n' && code.length > 0){
			cur = code.splice(0, 1)[0]
			res.push(cur)
		}
		console.log(res.join(' '))
	},
	
	// XXX use the real reader...
	// block...
	// syntax: [ ... ]
	// NOTE: the shorthand ']]' will close ALL the open blocks.
	// XXX should ']]' be smart enough to look ahead and close only the 
	// 		blocks not explicitly closed later???
	// 		..see below for more...
	'[': function(context){
		var block = []
		var code = context.code
		var cur = code.splice(0, 1)[0]
		while(cur != ']' && cur != ']]' && code.length > 0){
			if(cur == '['){
				cur = this['['](context)
			}
			block.push(cur)
			cur = code.splice(0, 1)[0]
		}
		// we need this to be able to jump out of all the nested blocks, 
		// thus we'll keep the ']]' in code and remove it explicitly 
		// later...
		if(cur == ']]'){
			// XXX should we look ahead and count the explicitly closed
			// 		via ']' and ']]' blocks???
			// 		...at this point this seems a bit complex...
			// 		...if there are more than one ']]' in a structure
			//		this might stop being deterministic...
			code.splice(0, 0, cur)
		}
		if(code.length == 0 && cur != ']' && cur != ']]'){
			console.error('Did not find expected "]".')
		} 
		return block
	},
	// drop the closing words...
	']]': function(context){},
	']': function(context){ console.error('Unexpected "]".') },

	// XXX macros are not recursive...
	'macro:': function(context){
		var ident = context.code.splice(0, 1)
		var cur = context.code.splice(0, 1)

		// as we do not have blocks yet we need to manually collect one ;)
		if(cur[0] == '['){
			cur = [ this['['](context) ]
		}

		this[ident] = cur[0]
	},

	// a no op...
	'\n': function(){ console.log('NL') },
}


// main namespace...
var NAMESPACE = {
	// constants...
	'true': true,
	'false': false,
	'null': 'null',

	'nop': function(){}, 

	'is?': function(context){ 
		return context.stack.pop() === context.stack.pop() },

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
		context.stack = [ context.stack ] },
	// expand block to stack... 
	// NOTE: this will append the block contents to stack, w.o. replacing 
	// 		stack contents. this is different to _s2b
	// ... [ ... ] -- ... ...
	'b2s': function(context){
		var c = context.stack.pop()
		c = c === undefined ? [] : c
		context.stack.splice.apply(context.stack, [context.stack.length, 0].concat(c))
	},
	'print': function(context){
		console.log('>>>', context.stack[context.stack.length-1]) },

	// turn a sting into a lexical list...
	// c -- b
	// XXX BUG see code...
	'lex': function(context){
		code = context.stack.pop()
		if(typeof(code) == typeof('abc')){
			// XXX BUG: '"aaa" "bbb"' translates to ['"aaa"', '" "', '"bbb"'] 
			// 		i.e. quotes w/o whitespace are eaten...
			if(/^\s*(['"]).*\1\s*$/m.test(code)){
				code = code.split(/^\s*(['"])(.*)\1\s*$/m)[2]
			}

			//console.log(code)

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

	// s c -- s
	'_exec': function(context){
		// block...
		var b = context.stack.pop()
		if(typeof(b) == typeof([]) && b && b.constructor.name == 'Array'){
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
		})
		// XXX is this the right way to go?
		context.ns = res.ns
		context.pre_ns = res.pre_ns
		return res.stack
	},
	// quote - push the next elem as-is to stack...
	// -- x
	'\\': function(context){
		return context.code.splice(0, 1)[0] },

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
		return !context.stack.pop() },
	// a b -- c
	'gt': function(context){
		return context.stack.pop() < context.stack.pop() },
	// a b -- c
	'eq': function(context){
		return context.stack.pop() == context.stack.pop() },

	// stack operations...
	// ... x -- x ...
	'rot': function(context){
		context.stack.splice(0, 0, context.stack.pop()) },
	// x ... -- ... x
	'tor': function(context){
		context.stack.push(context.stack.shift()) },
	// a b -- b a
	'swap': function(context){
		return context.stack.splice(context.stack.length-2, 1)[0] },
	// x -- x x
	'dup': function(context){
		return context.stack[context.stack.length-1] },
	// x -- x'
	// NOTE: this will do a deep copy...
	'clone': function(context){
		return JSON.parse(JSON.stringify(context.stack.pop())) },
	// x --
	'drop': function(context){
		context.stack.pop() },

	// a -- b
	// NOTE: all names are also strings so moo string? and 'moo' string?
	// 		are the same...
	'string?': function(context){
		return typeof(context.stack.pop()) == typeof('str') },

	// basic number operations...
	// a -- b
	'number?': function(context){
		return typeof(context.stack.pop()) == typeof(123) },
	// a b -- c
	'add': function(context){
		return context.stack.pop() + context.stack.pop() },
	'sub': function(context){
		return - context.stack.pop() + context.stack.pop() },
	'mul': function(context){
		return context.stack.pop() * context.stack.pop() },
	'div': function(context){
		return 1/context.stack.pop() * context.stack.pop() },

	// block/list operations...
	'block?': function(context){
		var e = context.stack.pop()
		return typeof(e) == typeof([]) && e && e.constructor.name == 'Array'
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
			l.splice(l.length + i, 0, e)
		} else {
			context.stack[context.stack.length-1].splice(i, 0, e)
		}
	},
	// b -- b e
	'pop': function(context){
		return context.stack[context.stack.length-1].pop() },
	// b -- b l
	'len': function(context){
		return context.stack[context.stack.length-1].length },
	// b c -- b
	'map': function(context){
		var c = context.stack.pop()
		var b = context.stack[context.stack.length-1]
		for(var i=0; i < b.length; i++){
			// exec block in a separate context...
			var res = run({
				//stack: [b, i, b[i], c],
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


	// object stuff...
	'{}': function(){ return {} }, 

	'object?': function(context){
		var o = context.stack[context.stack.length - 1]
		return o && o.constructor === Object
	},

	// set item...
	// o k v -- o
	'item!': function(context){ 
		var v = context.stack.pop()
		var k = context.stack.pop()
		var o = context.stack[context.stack.length - 1]

		o[k] = v
   	},

	// test item...
	// o k -- o t
	'item?': function(context){ 
		return context.stack.pop() in context.stack[context.stack.length - 1] },

	// get item...
	// o k -- o v
	'item': function(context){ 
		var k = context.stack.pop()
		return context.stack[context.stack.length - 1][k] },

	// remove/pop item from object...
	// o k -- o v
	'popitem': function(context){ 
		var k = context.stack.pop()
		var o = context.stack[context.stack.length - 1]
		
		var v = o[k]
		delete o[k]

		return v
   	},

	// o -- k
	'keys': function(context){ 
		return Object.keys(context.stack.pop()) },

	// make a prototype of b...
	// a b -- b
	// NOTE: if a is false, reset prototype...
	'proto!': function(context){
		var b = context.stack.pop()
		var a = context.stack.pop()
		b.__proto__ = a === false ? {}.__proto__ : a
		return b
	},

	// o -- p
	// XXX what should this be:
	// 		{} getproto
	'proto': function(context){ 
		return context.stack.pop().__proto__ },

	// -- o
	'ns': function(context){ 
		return context.ns },
	// o --
	'ns!': function(context){ 
		context.ns = context.stack.pop() },
}


// NOTE: hate how JS handles multi-line strings...
var BOOTSTRAP = [
'-------------------------------------------------------------------------------',
'',
' [S]lang is a [s]imple and complete [S]tack [lang]uage.',
'',
' Slang was designed for three main reasons:',
'	- a means to experiment with several aspects of language design,',
'	- an educational tool, to illustrate several programming language',
'	  concepts in a simple, hands-on manner,',
'	- fun!',
'',
'',
'',
'-------------------------------------------------------------------------------',
'',
' The system consists of:',
'	- Stack',
'	- Code',
'	- Namespace',
'	- basic runtime',
'',
' 	                 { NAMESPACE }',
'	                       ^',
'	                       |',
' 	[ .. STACK .. ] <-- runtime -- [ .. CODE .. ]',
'',
'',
' A namespace is a basic key/value store.',
'',
' The runtime "reads" entities from the code stream one by one and depending on',
' whether an entity exists in the namespace it is either pushed on the stack',
' or evaluated.',
'',
' The evaluated entity is traditionally called a "word" (function in non-stack',
' languages). The only thing that makes a word different from any other entity',
' is that it matches a key in the namespace, as mentioned above.',
'',
' In Slang evaluation is done simply by executing the value of the matched',
' key/value pair in the namespace. An over-simplified way to explain',
' evaluation is to say that the content of the value is pushed to the',
' code stream to be read right away, that\'s almost it, if we skip a',
' couple of details (see: _exec, exec and for details see: eval)',
'',
' The system contains two types of words:',
'	- Host words -- defined by the host system,',
'	- User words -- defined within the system (like this bootstrap code).',
'',
' Words may read and affect any of the three system parts:',
'	- Stack',
'	- Code',
'	- Namespace (not yet fully implemented)',
'',
' Traditioannly, in stack languages words affect only the stack, this is',
' one of the motivations to implement Slang, that is, to experiment with',
' different ways to go with stack languages.',
'',
'',
' TODO: add a complete word-set for work with lists/blocks',
' TODO: add a complete word-set for work with dicts/namespaces',
' TODO: add topological comparison/diff',
'',
'',
'',
'-----------------------------------------------------------------------------',
'',
' Traditionally, stack languages use a "stack effect" notation to document how',
' words affect the stack state, a kind of before-after transformation. here is',
' a basic example showing how the word "add" works:',
'',
'		stack   code',
'		      | 1 2 add',
'		    1 | 2 add',
'		  1 2 | add',
'		1 2 [add]			(a)',
'		    3 |				(b)',
'',
'',
' Here the stack effect represents the difference between two states: the',
' moment when the word is "read" (a) and the stack state after it is',
' evaluated (b) and is written like this:',
'',
'		( a b -- c )',
'',
'',
' But, due to the fact that in Slang all three of the stack, code and namespace',
' can be affected by words, we need an extended stack effect notation. to',
' include at least the second most common case, the "code effect".',
' To illustrate, here is an example of a word that has a simple code effect,',
' the "+":',
'',
'		stack   code',
'		      | 1 + 2',
'		    1 | + 2',
'		   1 [+] 2			(a)',
'		    3 |				(b)',
'',
'',
' Here we see that in addition to affecting the stack, 2 is "pulled" from the',
' code stream. To indicate this we will use "|" that splits the stack (left)',
' and code (right) states, and write the stack effect for the word "+" like',
' this:',
'',
'		( a | b -- c |  )',
'',
'',
' NOTE: this notation is currently used as a means to documenting words and is',
' not interpreted in any way.',
'',
'',
'',
'-------------------------------------------------------------------------------',
'',
' Basic words for block manipulation:',
'',
' Get block length',
'',
'		[ 1 2 3 ] len',
'				->	[ 1 2 3 ] 3',
'',
'',
' Pop element form block tail',
'',
'		[ 1 2 3 ] pop',
'				->	[ 1 2 ] 3',
'',
'',
' Push element to block tail',
'',
'		[ 1 2 3 ] 4 push',
'				->	[ 1 2 3 4 ]',
'',
'',
' NOTE: all indexes can be negative values, these will indicate the',
'	position relative to the tail, -1 being the last element.',
'',
' Get element at position (0)',
'',
'		[ 1 2 3 ] -1 at',
'				->	[ 1 2 3 ] 3',
'',
'',
' Put element (123) at position (0)',
'',
'		[ 1 2 3 ] 123 0 to',
'				->	[ 123 2 3 ]',
'',
'',
' Put element (123) before position (0)',
'',
'		[ 1 2 3 ] 123 0 before',
'				->	[ 123 1 2 3 ]',
'',
'',
' Like before but puts the element after position',
'',
'		[ 1 2 3 ] 123 0 after',
'				->	[ 1 123 2 3 ]',
'',
'',
' Expand block to stack -- "block 2 stack"',
'',
'		[ 1 2 3 ] b2s',
'				->	1 2 3',
'',
'',
' Map a block/word to each element in a block',
'',
'		[ 1 2 3 ] [ 1 add ] map',
'				->	[ 2 3 4 ]',
'',
' the returned value (stack) of the input block is put into the result',
' block, this enables us to both remove (empty stack) and expand (more',
' than one value) the resulting list...',
'',
'		[ 1 2 3 4 ] [ dup ] map',
'				->	[ 1 1 2 2 3 3 4 4 ]',
'',
'		[ 1 2 3 4 ] [ dup 2 gt ? [ ] else [ . ] ] map',
'				->	[ 3 4 ]',
'',
'',
' this enables us to construct words like filter, which makes the code',
' in the last example more readable:',
'',
'		[ 1 2 3 4 ] [ 2 gt ] filter',
'				->	[ 3 4 ]',
'',
' Reduce enables us to take a list and "reduce" it to a single value...',
'',
'		[ 1 2 3 4 ] \\add reduce',
'				->	10',
'',
'',
'-------------------------------------------------------------------------------',
'',
' Objects and namespaces:',
'',
' Create a variable word o and p and set them to empty objects...',
'',
'		ns',
'			o {} item!',
'			p {} item!',
'		.',
'',
' Set attribute (key-value pair) on object...',
'',
'		o x 123 item!',
'				-> o',
'',
' Get attribute x value...',
'',
'		o x item',
'				-> 123',
'',
' Test if attribute x exists...',
'',
'		o x item?',
'				-> true',
'',
' Get block of attribute idents...',
'',
'		o keys',
'				-> [ ... ]',
'',
' Get and remove an attribute value from o...',
'',
'		o x popitem',
'				-> 123',
'',
' Set prototype of o to p',
'',
'		o p proto!',
'				-> o',
'',
' Get prototype of o',
'',
'		o proto',
'				-> p',
'',
'',
'-------------------------------------------------------------------------------',
's2b drop               -- cleanup after docs...',
'ns {} proto! ns! .     -- keep new words in a seporate context...',
'--',
'-- With that out of the way, let\'s start with the bootstrap...',
'',
'-- prepare the basic syntax for defining words...',
'ns',
'	-- Some sorthands...',
'	. ( x -- )',
'		[ drop ] item!',
'	rot2 ( .. x y -- x y .. )',
'		[ rot rot ] item!',
'	tor2 ( x y .. -- .. x y )',
'		[ tor tor ] item!',
'',
'	-- Friendly exec...',
'	exec ( b -- ... )',
'		[ s2b pop _exec b2s ] item!',
'	-- Create a word...',
'	word! ( w b -- )',
'		[ rot2 ns tor2 item! . ] item!',
'	-- Word definition...',
'	-- syntax: :: <ident> <value>',
'	:: ( | w b -- | )',
'		[ \\word! \\exec 2 2 _swapN ] item!',
'.',
'',
'',
'-- misc...',
'',
':: true? ( a -- b ) [ not not true eq ]',
':: false? ( a -- b ) [ not true? ]',
'',
'-- we already have gt and eq, now let\'s define the rest...',
':: ne ( a b -- c ) [ eq not ]',
':: lt ( a b -- c ) [ swap gt ]',
':: ge ( a b -- c ) [ lt not ]',
':: le ( a b -- c ) [ gt not ]',
'',
':: inc ( a -- b ) [ 1 add ]',
':: dec ( a -- b ) [ 1 sub ]',
':: ! ( a -- b ) [ [ dup 1 ne ] ? [ dup 1 sub ! mul ] ]',
'',
'',
'',
'-- Stack/code manipulation...',
'',
':: _swap ( x | y -- y | x ) [ 1 1 _swapN ]',
':: _push ( x |  -- | x ) [ 0 _swapN ]',
':: _pull (  | x -- x |  ) [ 0 swap _swapN ]',
'',
':: eval ( c -- ... ) [ lex prep exec ]',
'-- like exec but will run a block in current context...',
':: b2c [ len rot b2s tor 0 _swapN ]',
'',
':: swap2 ( a _ b -- b _ a ) [ swap rot swap tor swap ]',
':: dup2 ( a b -- a b a b ) [ dup swap2 dup rot swap2 tor swap ]',
'',
'-- this is here for devel use only',
':: _clear ( ... -- ) [ s2b print drop ] ',
':: _stack_size ( -- l ) [ s2b len swap b2s tor ] ',
'',
'',
'',
'-- Flow control...',
'',
'-- Classic conditional word:',
'--   [ cond ] [ A ] [ B ] if',
'--',
'-- A bit too "polish" in my view ;)',
':: if ( cond a b -- ... ) [ rot rot exec true? tor and tor or exec ]',
'',
'-- Ternary operator, this can take two forms:',
'--   COND ? A',
'--   COND ? A else B',
'--',
'-- We will define this in stages, first the helpers:',
'-- run then block and drop \'else B\' if it exists...',
':: _run_then ( a x | -- ... | x  )',
'	( a else | b -- ... | )',
'		[ \\exec swap dup \\else eq [ (drop else) drop \\drop _swap 6 ] and',
'				[ (run as-is) 1 _push 4 ] or',
'				b2s 0 _swapN ]',
'-- if \'else B\' exists, run it, else cleanup...',
':: _run_else ( a | --  | a  )',
'	( b else | b -- ... | )',
'		[ drop dup \\else eq [ drop \\exec _swap 4 ] and',
'				[ 1 _push 2 ] or',
'				b2s 0 _swapN ]',
'-- And now the main operator...',
'-- NOTE: this may actually have one of three stack effects...',
':: ? ( c | a -- | )',
'	( c | a -- ... | )',
'	( c | a else b -- ... | )',
'		[ exec [ _run_then 1 ] and [ swap _run_else 2 ] or b2s 2 _swapN ]',
'',
'',
'',
'-- List/block 2\'nd gen stuff...',
'',
'-- make a new block instance shorthand...',
':: [] [ [ ] clone ]',
'',
'-- insert element after index...',
':: after ( b e i -- b ) [',
'	-- special case, when at end, need to push the alement after it...',
'	dup [ -1 eq ] ?',
'		[ . push ]',
'	else',
'		[ inc before ]]',
'',
'-- NOTE: the "]]" in the last definition, it\'s a shorthand, it closes',
'--	ALL the open blocks to this point.',
'--	...thus it can be used ONLY as the very last word in a set.',
'',
'-- push element to tail of block...',
':: push ( b e -- b ) [ swap len rot swap tor to ]',
'',
'-- Replace a pattern (p) in block with value (v)...',
'-- NOTE: this will replace ALL patterns...',
':: replace ( l v p -- l ) [',
'	swap',
'	[ . \\VALUE ] clone',
'		swap 2 to',
'		rot',
'	-- XXX for some reason ? without else messes things up...',
'	[ dup \\PATTERN eq ? VALUE_BLOCK else [ ] ] clone',
'		swap 2 to', 
'		tor 5 to',
'	map ]',
'',
'-- Filter the block via a condition...',
'--',
'-- the condition block must have the folowing stack effect: elem -- bool',
':: filter ( b c -- b ) [',
'	-- prepare the condition...',
'	[ dup \\TEST exec ] clone',
'		swap TEST replace',
'	-- prepare the template...',
'	[ TEST ? [  ] else [ . ] ] clone',
'		swap TEST replace',
'	map ]',
'',
':: reduce ( L b -- s ) [',
'	rot clone',
'	-- empty list, reduction is null...',
'	[ len 0 eq ] ?',
'		[ . tor . null ]',
'	-- reduction of list of len 1 is it\'s content, so just pop it...',
'	else [ [ len 1 eq ] ?',
'		[ tor . b2s ]',
'	-- and now recursively reduce the elements till the list is 1 in length...',
'	-- XXX ugly',
'	else [',
'		pop rot pop rot',
'			[] tor push tor push',
'		-- get and run the block...',
'		tor dup clone rot _exec',
'		-- process the result...',
'		pop rot . tor push tor',
'			reduce ]]',
'',
'-- Create a block containing a range of numbers form 0 to n-1...',
':: range ( n -- b ) [',
'	-- initial state...',
'	[ dup number? ] ? ',
'		[ [] swap ]',
'	-- get first elem...',
'	else',
'		[ 0 at ]',
'	-- we got to the end...',
'	[ dup 0 eq ] ? ',
'		drop',
'	-- dec push new and continue...',
'	else',
'		[ 1 sub 0 before range ]]',
'',
'-- Sum up the elements of a block...',
':: sum ( L -- s ) [ [ add ] reduce ]',
'',
'',
'-- Meta-word examples (experimental)...',
'',
'-- Here is an infix operator example...',
'-- 	:: + ( a | b -- c |  ) [ \\exec 2 0 _swapN \\exec \\add 2 1 _swapN ]',
'-- now let\'s make a meta function to make things shorter...',
':: infix: ( | op word -- | ) [',
'	[',
'		-- format the word definition...',
'		--     NAME WORD  ->  :: NAME WORD',
'		s2b \\:: -2 before b2s',
'',
'		-- our template...',
'		-- exec the left side...',
'		[ \\exec 2 0 _swapN',
'				-- exec the right side and arragne the args for WORD...',
'				\\exec \\WORD 2 1 _swapN ] clone',
'			-- get the WORD and insert it into the template above (opsition 8)...',
'			swap WORD replace',
'',
'		-- push to code / run',
'		3 0 _swapN ',
'	-- swap the arguments and the code to be executed...',
'	] \\exec 2 2 _swapN ]',
'',
'-- Now making a word/2 an infix operator is trivial...',
'-- NOTE: these are at this point stupid and do not support priorities...',
'infix: + add',
'infix: - sub',
'infix: * mul',
'infix: / div',
'',
'-- these need more thought...',
'infix: == eq',
'infix: != ne',
'infix: > gt',
'infix: < lt',
'infix: <= le',
'infix: >= ge',
'',
'-- experimental...',
'infix: = word!',
'',
'',
'-- Prefix operation definition...',
'-- Example:',
'--		:: echo: ( | txt -- | ) [ \\_flip \\print _flip ]',
'-- swap stack and code untill the block finishes and consumes it\'s arguments',
'-- then swap them back...',
':: prefix: ( | op word -- | ) [',
'	[',
'		-- format the word definition...',
'		--     NAME WORD  ->  :: NAME WORD',
'		s2b \\:: -2 before b2s',
'',
'		-- the code template',
'		[ \\_flip \\exec \\WORD _flip ] clone',
'			swap WORD replace',
'			3 0 _swapN',
'	] \\exec 2 2 _swapN ]',
'',
'',
'',
'-- Tests and examples...',
'',
'-- Mandatory "hello word" word example...',
':: hi ( -- ) [ "Hello World!" print drop ]',
'',
'-- Create a block containg a range of numbers from f to t, inclusive...',
':: range/2 ( f t -- b )',
'		[ dup2 swap sub swap . inc range swap [] swap push \\+ 0 before map ]',
'',
'-- this will enable us to create ranges via 0 .. 4',
'infix: .. range/2',
'',
//':: range/3 ( a n s -- b )',
//'		[ swap range swap [] swap push \\* 0 before map ]',
'',
'-- Execute block in a context...',
'-- synctx: context: <block>',
'prefix: context: [ ns {} proto! ns! exec ns proto ns! ]',
'',
'',
''].join('\n')


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
		code = [ '\\', code, 'lex', 'prep', 'exec' ]
	} else {
		code = [ code, 'prep', 'exec' ]
	}

	context.code = code
	return run(context).stack
}



/********************************************************** RSlang ***/
/*
var RS_PRE_NAMESPACE = {
	// XXX using the ";" here just for the experiment, in the real thing
	// 		if this thing pans out, that is, use indent... (a-la make/Python)
	// XXX this reads ahead at the moment, but it must read back...
	';': function(context){
		var line = []
		var code = context.code
		var cur = code.splice(0, 1)[0]
		while(cur != ';' && code.length > 0){
			line.push(cur)
			cur = code.splice(0, 1)[0]
		}
		
		context.code.splice.apply(context.code, [0, 0].concat(line.reverse()))
	},

	'[': PRE_NAMESPACE['['],
	'macro:': PRE_NAMESPACE['macro:'],
}

RS_CONTEXT = {
	stack: [],
	code: STARTUP.slice(),
	ns: NAMESPACE,
	pre_ns: PRE_NAMESPACE,
}

// NOTE: we use the traditional bootstrap for this...
run(RS_CONTEXT)

RS_CONTEXT.pre_ns = RS_PRE_NAMESPACE

function rslang(code, context){
	context = context == null ? RS_CONTEXT : context

	return slang(code, context)
}
//*/



/**********************************************************************
* vim:set ts=4 sw=4 spell :                                                */
