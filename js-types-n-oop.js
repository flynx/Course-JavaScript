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
// each one is different but all are apples. Now imagine two people, 
// each looking at an apple, we can say that each person sees the value 
// "apple", those values are equal, and if those people are sitting at 
// the same table and looking at the same apple, we say that their 
// apples are the same, or they are of the same identity, (i.e. the 
// same apple).  
// Then if we can take a different set of people looking at apples, but 
// now each one has their own personal apple, the values are still the 
// same, both apples are still apples but now they are different apples, 
// aren't they? And thus we say they are of different identities.
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
// allot of other languages where numbers are represented closer to the 
// low-level hardware implementation and thus are represented by a 
// whole range of number types.
//
// Numbers can also be written using different base notations:
	var bin = 0b101010
	var oct = 052
	var hex = 0xFF
	var dec = 42

//
// But note that these are just different notations and all of the 
// above resolve to the same number.
//


// Strings
	var string = 'string'
	var another_string = "also a string"
	var template = `
		a template string.
		this can include \\n's
		also summorts expansions ${ '.' }`

// XXX a note on template strings

// Boolieans
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
// XXX


// Automatic type coercion
//
// XXX


// Type checking
//
// XXX

	typeof(42) // -> 'number'
	typeof('meaning of life') // -> 'string'


// Note that this has a small "inconsistency" that can be used to check 
// if a variable is defined.

	typeof(unknown_variable) // -> 'undefined'



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

// Type cheking
//
// Here thesame approach as for simple types is not productive:

	typeof([42]) // -> 'object'
	typeof({}) // -> 'object'

// so a better approach would be to:

	[42] instanceof Array // -> true

// but since all objects are objects the test can get quite generic (XXX)

	[42] instanceof Object // -> true
	{} instanceof Object // -> true

//
// this essentially checks if the left oprtand is related to (i.e. in the 
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
// bare instance and passes it to the function as the call context.
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
// via the new syntax. This can be desirable in some cases but in 
// general this is a pitfall, so let's unify the two cases:
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
// XXX

// Mixing builtin types
//
// In general this is impossible in JavaScript due to the lack of any 
// mechanism of horizontal name resolution in the inheritance chain like 
// multiple inheritance (hence why we call it a chain and not a tree).
//
// So there is no way, for example, to make something both an array and
// a function at the same time.
//

	




// XXX Reflect.construct(Function, args, newConstructor)
// 		mainly usefull if the resulting instance has to be of a builtin 
// 		type like a function (callable) or an array...
// 		...especially when overloading the constructor
// XXX should this be in advanced topics???



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
