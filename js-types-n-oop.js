/**********************************************************************
* 
* JavaScript types and objects
*
*
**********************************************************************/
//
// Types and objects
// =================
//
// 	JavaScript's type system is split into two categories of enteties: 
// 	basic types or values and objects, they differ in several aspects.
//
// 						| values			| objects
// 		----------------+-------------------+--------------------------
// 		     mutability	| imutable			| mutable
// 		----------------+-------------------+--------------------------
// 		       identity	| equal values are 	| different objects
// 						| the same entity	| can have same 
// 						| (singletons)		| structure / "value"
// 		----------------+-------------------+--------------------------
//
//
// Value vs. Identity
// ------------------
//
// Imagine an apple, it's a "thing" that is an "apple", or we say that
// it has a value "apple". There are lots of apples in the world, 
// each one is slightly different but all are apples. Now imagine two 
// people, each looking at an apple, we can say that each person sees
// the value "apple", those values are equal, and if those people are
// sitting at the same table and looking at the same apple, we say that 
// their apples are the same apple, or in JavaScript-ish, they are of 
// the same identity.  
// Then if we can take a different set of people looking at apples, but 
// now each one has their own personal apple, the values are still the 
// same, both apples are still looking at apples but now their apples 
// are different, aren't they? And thus we say they are of different 
// identities.
// We'll come back to this concept a bit later, once we introduce 
// JavaScript values and types.
//
//
// Basic values
// ------------
//
// Numbers
	var integer = 123
	var floating_point = 3.1415

//
// Note that all numbers are of the same "type", this is different to 
// allot of other languages where numbers are implemented closer to the 
// low-level hardware implementation and thus are represented by a 
// whole range of number types.
//
// Numbers can also be written using different base notations:
	var bin = 0b101010
	var oct = 052
	var hex = 0xFF
	var dec = 42
	var exp = .42e2

//
// But note that these are just different notations, and all of the 
// above resolve to the same number.
//

// Numbers also have several limitations:
//
// - precision, rounding errors and fractions
	0.1 + 0.2 == 0.3 // -> false

//   This is due to how floating point numbets ate traditionally 
//   implemented on CPUs (see: IEEE-754).

// - large number rounding
	Number.MAX_SAFE_INTEGER + 10 - 10 == Number.MAX_SAFE_INTEGER

//   In general numbers larger than Number.MAX_SAFE_INTEGER and 
//   smaller than Number.MIN_SAFE_INTEGER should not be used for 
//   math operations (see BigInt).
//
// Note that neither issue is specific to JavaScript but rather are 
// side-effects of number implementations in modern computers and
// the trade-offs of these implementation on each level from the 
// CPU to the high-level languages.
//
// For more details see:
// 	- https://en.wikipedia.org/wiki/IEEE_754-2008_revision
// 	- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER


// Strings
	var string = 'string'
	var another_string = "also a string"
	var template = `
		a template string.
		this can include \\n's
		also summorts expansions ${ '.' }`

// That last sting is an example of string interpolations, for more info 
// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals


// Booleans
	var t = true
	var f = false


// Nulls
	var n = null
	var u = undefined
	var not_a_number = NaN



// Values are in general:
//
// - singletons
	var a = 3.14
	var b = 3.14
	a === b // -> true

	// In general equal basic values are the same value and there is 
	// no way to create two copies of the same value.


// - imutable
	var a = 1
	var b = a

	// a and b hold the same value (1)
	a === b // -> true

	// now we update a...
	a += 1
	a === b // -> false
	// Note that we updated the value referenced by a, i.e. the old 
	// value (1) was not modified by the addition (b is still 1), 
	// rather a new value (2) was created and assigned to a.
	


// Equality and identity
//
// XXX link with next section...


// Automatic type coercion
//
// In JavaScript most operations are defined on operands of the same 
// type. If the types are different JavaScript will try and convert 
// one of the values to make the types match.
//
// In most cases this is fully transparent, for example:
	'42' == 42 // -> true
	2 * '21' // -> 42
	undefined == null // -> true

// But in cases where the same operation is defined for both types
// the result may *seem* less predictable, for example `+` defines both
// number addition and string concatenation:
	1 + 2 // -> 3
	'a' + 'b' // -> 'ab'

// But when mixed it reverts to concatenation:
	1 + '2' // -> '12'

// This feature can both help make the code simpler and more generic if
// used consciously and at the same time can prove quite frustrating if
// neglected.
//
// Note that this neglect and carelessness is the main reason it is quite 
// popular to avoid type coercion and instead overuse strict comparisons 
// and defensively over-check everything, at times raised to such levels 
// as to define whole languages around this (like TypeScript).


// Checking type
//
// All values in JavaScript have a type, this type is returned via:

	typeof(42) // -> 'number'
	typeof('meaning of life') // -> 'string'


// Note that this has a small "inconsistency" that can be used to check 
// if a variable is defined (and is not referencing undefined).

	typeof(unknown_variable) // -> 'undefined'

// But also note that if a variable references undefined its type will 
// also be 'undefined':

	var x
	typeof(x) // -> 'undefined'

	typeof(undefined) // -> 'undefined'

// This is a general theme in JavaScript -- since things that are not 
// explicitly assigned a value resolve to undefined, checking if something
// is explicitly defined by comparing it to undefined is not consistent
// as this approach can not distingwish between something that is not 
// defined and something that references undefined explicitly.
// This is mainly an issue with attributes and variables (implemented as
// attributes).
// (XXX move this to a more appropriate spot)

// a couple notable types that can be counter-intuitive:

	typeof(NaN) // -> 'number'
	typeof(null) // -> 'object'

// For NaN use:

	isNaN(NaN) // -> true

// And for null/undefined a more generic and non-strict comparison is 
// recommended:

	var x = null
	var y = undefined

	x == null // -> true
	y == null // -> true

// Strict comparisons also work but unless it explicitly required to
// differentiate between null and undefined (which is either a rare case 
// or a sign of bad design) they should be avoided in favor of the 
// non-strict and more flexible comparisons shown above:

	x === null // -> true
	y === undefined // -> true



// Objects
// -------
//
// One very useful distinction/simplification from a lot of other 
// languages is that JavaScript for most of its history did not have a 
// dict/map/hashmap type, it was unified with the generic object type.
//
// Note that a Map type was added in ES6 but that is mostly a duplication
// of base object functionality with a set of added methods with one 
// important difference -- Map keys can be any arbitrary object while 
// object keys can only be strings.
//

// Checking type
//
// Since in JavaScript all non-basic typed values are objects, the same 
// approach as for simple types is not productive:

	typeof([42]) // -> 'object'
	typeof({}) // -> 'object'

// so a better approach would be to:

	[42] instanceof Array // -> true

// but since all objects are objects the test can get quite generic

	[42] instanceof Object // -> true
	{} instanceof Object // -> true

//
// this essentially checks if the left operand is related to (i.e. in the 
// inheritance chain of) the second operand's .prototype, or we can say
// that it id "inherited" from the constructor.
//



// Prototypes and inheritance
//
// XXX

	var a = {
	}

	var b = Object.create(a)

	var c = {
		__proto__: b,
	}


// Constructors
//
// A constructor is simply a function that "constructs" or populates an
// object. 
//
// By convention constructor functions are capitalized (Pascal-case)
//
// Classic constructors are called with a "new" keyword which creates a
// bare instance and passes it to the function as the call context (this).
//

	function A(){
		this.attr = 42
		this.method = function(){
			console.log('Hello world!')
		}
	}

	var x = new A()

	var y = {
		__proto__: A.prototype,
	}

//
// The problem with the default way this is done is that now a 
// constructor will behave differently when called directly or if called
// via the new syntax due to different contexts. This can be desirable 
// in some cases but in general this is a pitfall, so let's unify the 
// two cases:
//

	function B(){
		var obj = {
			__proto__: B.prototype,
		}
		return obj
	}

	// this can be called with and without new:
	var z = B() 

	// less naive -- reuses the instance created by new...
	function C(){
		var obj = this instanceof C ?
			this
			: { __proto__: C.prototype }
		return obj
	}
	// make C instances related to B...
	C.prototype.__proto__ = B.prototype

//
// Note that constructor extension is trivial if you think of how 
// prototypical inheritance works, to link A and B "instances" all we 
// needed to do is link the constructor prototypes in the code above.
//


// Extending builtin types
//
// The above approach will not work for "special" built-in  objects,
// like functions, arrays and the like, because the created instance 
// is a generic object and not a function, array or other built-in 
// derived instance.
// We can avoid this by either creating the base instance manually 
// or by using Reflect.construct(..).
//
// Here we'll extend Array:

	// XXX revise...
	function List(){
		var obj = this instanceof List ?
			this
			// create an array base object but link it to List as prototype...
			// NOTE: if List is not linked to Array the instances will 
			// 		not have access to any of the array methods but will
			// 		support the indexing syntax.
			: Reflect.construct(Array, arguments, List)
		return obj
	}

// XXX

// XXX should this be in advanced topics???


// Mixing multiple builtin types
//
// In general this is impossible in JavaScript due to the lack of any 
// mechanism of horizontal name resolution in the inheritance chain like 
// multiple inheritance (hence why we call it a chain and not a tree).
//
// So there is no way, for example, to make something both an array and
// a function at the same time.
//


// Classes and JavaScript
//
// Since the class syntax is simply a more restrictive way to do the 
// same as the above, in addition to introducing more "the same but 
// slightly different" ways to define functions and methods thus adding
// lots of new details, pitfalls and nuances that give us essentially 
// the same functionaly that already existed in the language with 
// the onus of additional complexity, we will be completely ignoring 
// them in this document.



/**********************************************************************
*                                                vim:set ts=4 sw=4 : */
