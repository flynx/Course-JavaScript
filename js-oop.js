/**********************************************************************
* 
* The basics of JavaScript OOP
*
*
**********************************************************************/



/*********************************************************************/
//
// The basic prototype inheritance
// -------------------------------
//
// First we'll create a  basic object a

	var a = {
		x: 1,
		y: 2,
	} 

// Then we will create a new object using 'a' as a "base" 

	var b = Object.create(a)
	b.z = 3

// Another way to do this:

	var b = {
		__proto__: a,
		z: 3,
	}

// The object 'b' now has both access to it's own attributes ('z') and 
// attributes of 'a' ('x' and 'y')

	b.x					// -> 1
	b.z					// -> 3

// What we see is that if the attribute is not found in the current 
// object the next object is checked, and so on, this next object is
// called "prototype". 
// These prototype chains can be of any length.
// Cycles in prototype chains are not allowed, see note further down for
// an example.
//
// Note that this works for reading (and mutating) attributes, but when 
// writing or deleting we are affecting ONLY the local object and 
// attributes explicitly defined in it, or its' "own" attributes.

	b.x = 321
	b.x					// -> 321
	a.x					// -> 1

// Notice also that a.x is no longer visible from 'b', this is called 
// "shadowing", we say: a.x is shadowed by b.x, now let us delete 'x' 
// from 'b' to reveal the shadowed a.x

	delete b.x
	b.x					// -> 1

// But, trying to delete .x from 'b' again will have no effect, this is 
// because .x no longer exists in 'b'

	delete b.x
	b.x					// -> 1


// Now back to the mechanism that makes all of this work...
//
// First we'll try couple of easy ways to see the local and non-local 
// sets of attributes:
	
	// show local or "own" only attribute names (keys)...
	Object.keys(b)		// -> z

	// show all accessible keys...
	for(var k in b){ 
		console.log(k) }
						// -> x, y, z

// Another way to test if the attribute is own/local

	b.hasOwnProperty('z')	// -> true
	b.hasOwnProperty('x')	// -> false


// What happens under the hood is very simple: b references it's 
// "prototype" via the .__proto__ attribute:

	b.__proto__ === a	// -> true


// We can read/set this special attribute just like any other attribute 
// on most systems.
//
// NOTE: we did not see .__proto__ in the list of accessible attributes
// 		because it is a special attribute (property), it is implemented 
// 		internally and is not enumerable.
// NOTE: cyclic prototype chains are actively not allowed, e.g. creating
// 		a chain like the following will fail:
// 			var a = {}
// 			var b = Object.creating(a)
// 			a.__proto__ = b
//
//
// Thus, we could define our own equivalent to Object.create(..) like
// this:

	function clone(from){
		return {
			__proto__: from,
		}
	}

	var c = clone(b)


// Out of curiosity let's see if .__proto__ is defined on a basic object

	var x = {}

	x.__proto__			// -> {}

// Turns out it is, and it points to Object's prototype

	x.__proto__ === Object.prototype
						// -> true

// We will discuss what this means and how we can use this in the next 
// sections...
//
// As a side note, Object.prototype is the "root" most object in 
// JavaScript and usually is "terminated" with null, i.e.:

	Object.prototype.__proto__ === null

// We'll also need this a bit later...
//
// And can create an object with a null prototype like this:

	var raw_obj = Object.create(null)
	var raw_obj = clone(null)

	// or manually...
	var raw_obj = {}
	raw_obj.__proto__ = null

// These "raw" objects differ from normal objects in that they do not 
// inherit any interface methods, defined in the Object, like the 
// .hasOwnProperty(..) we used above, this can be useful in some cases.



// The Constructor Mechanism
// -------------------------
//
// JavaScript provides a second, complementary mechanism to inherit 
// attributes, it resembles the class/object relationship in languages
// like C++ but this resemblance is on the surface only, as it still 
// uses the same prototype mechanism as basis, as described above.  
//
// We will start by creating a "constructor":
	
	function A(){
		this.x = 1
		this.y = 2
	}

// Technically a constructor is just a function, what makes it a 
// "constructor" is only how we use it...

	var a = new A()

// The above aproach has one rather big flaw -- if called without new
// it will modify the root contect (i.e. window or global)
// A safer way to define a constructor:

	function A(){
		return {
			__proto__: A.prototype,
			x: 1,
			y: 2,
		}
	}

	var a = new A()
	var a = A()

	// XXX a way to check if we are running in a new context...
	function A(){
		var obj = this instanceof A ?
			this
			: { __proto__: A.prototype }
		obj.x = 1
		obj.y = 2
		return obj
	}

// Some terminology:
// - in the above use-case 'A' is called a constructor,
// - the object returned by new is called an "instance" (in this case 
//   assigned to 'a'),
// - the attributes set by the constructor (x and y) are called 
//   "instance attributes" and are not shared (obviously) between 
//   different instances, rather they are "constructed" for each 
//   instance independently.
//
//
// Let's look in more detail at what 'new' does here:
// 	1) creates an empty object
// 	2) sets a bunch of attributes on it, we'll skim this part for now
// 	3) passes the new object to the constructor via 'this'
// 	4) after the constructor finishes, this object is returned
//
// We could write a simplified equivalent function:

	function construct(func){
		var obj = {}
		func.apply(obj)
		return obj
	}

	var b = construct(A)

// But at this point this all looks like all we did is move the attribute
// definition from a literal object notation into a constructor function,
// effectively adding complexity. 
// And now instead of "inheriting" and reusing attributes we make a new
// set for each individual instance.
// So hat are we getting back from this?
//
// To answer this question we will need to look deeper under the hood,
// specifically at a couple of special attributes:

	// we saw this one before...
	a.__proto__			// -> {} 

	// this points back to the constructor...
	a.constructor		// -> [Function A]


// These are what makes this fun, lets write a more complete 'new' 
// re-implementation:
	
	function construct(func, args){
		var obj = {}

		// set some special attributes...
		obj.__proto__ = func.prototype

		// call the constructor...
		var res = func.apply(obj, args)

		// handle the return value of the constructor...
		if(res instanceof Object){
			return res
		}
		return obj
	}

	var b = construct(A)


// There are two important things we added here:
// 1) we now explicitly use the .prototype attribute that we saw earlier
// 2) we return the resulting object in a more complicated way
//
// Each time a function is created in JavaScript it will get a new empty
// object assigned to it's .prototype attribute.
// On the function level, this is rarely used, but this object is very 
// useful when the function is used as a constructor.
//
// As we can see from the code above, the resulting object's .__proto__
// points to the constructor's .prototype, this means not-own the 
// attributes accessed via that object are resolved to the prototype.
// In the default case this is true, but in general it's a bit more 
// flexible, we'll see this in the next section.
//
// And the way we handle the return value makes it possible for the 
// constructor to return a custom object rather than use the one 
// provided in its "this" by new.
//
//
// So if we add stuff to the constructor's .prototype they should be 
// accessible from the object

	// the following three lines actually add attributes to the same 
	// object...
	A.prototype.k = 123
	a.constructor.prototype.l = 321
	a.__proto__.m = 333

	// for illustration, we'll set some object own attributes
	a.k = 'a!'
	b.k = 'b!'

	a.k					// -> 'a!'
	a.l					// -> 321
	a.m					// -> 333


// These values are accessible from all objects constructed by A since
// all of them point to A with both the .constructor and .__proto__ 
// attributes

	b.k					// -> 'b!'
	b.l					// -> 321
	b.m					// -> 333


// This works for any constructor, including built-in constructors and
// since name resolution happens in runtime all instances will get the 
// new functionality live, as it is defined:

	// a "class method", like .keys(..) but return all available keys...
	Object.allKeys = function(o){
		var res = []
		for(var k in o){
			res.push(k)
		}
		return res
	}
	// now make these into real methods we can use from any object...
	Object.prototype.keys = function(){ return Object.keys(this) }
	Object.prototype.allKeys = function(){ return Object.allKeys(this) }

	b.keys()			// -> ['k']
	b.allKeys()			// -> ['x', 'y', 'k', 'l', 'm']
						// 	NOTE: x and y are set in the A constructor 
						// 		above...



// Inheritance chains
// ------------------
//
// In both inheritance mechanisms, each step is checked via the same 
// rules recursively, this makes it possible to build inheritance chains
//
// We will create a chain:
//
// 		c -> b -> a
//

	var a = {x: 1}

	var b = Object.create(a)
	b.y = 2

	var c = Object.create(b)
	

	c.x					// -> 1
	c.y					// -> 2


// Creating an inheritance chain via the constructor mechanism is a bit
// more involved, and there are multiple ways to do this...
//
// Here we will create a similar chain to the above for comparison:
//
// 		C -> B -> A
//

	function A(){}

	A.prototype.x = 1


	function B(){}
	// NOTE: if this is done after an instance is created, that instances'
	// 		.__proto__ will keep referencing the old prototype object.
	// 		see the next constructor for a way around this...
	B.prototype = Object.create(A.prototype)
	// NOTE: we'll need to overwire this to B as the value inherited from
	// 		A.prototype will obviously be A...
	B.prototype.constructor = B

	B.prototype.y = 2


	function C(){}
	// NOTE: this is safer than Object.create as it does not overwrite
	// 		the original C.prototype and thus will affect all existing 
	// 		instances of C, if any were created before this point...
	// NOTE: the C.prototype.constructor field is already set correctly 
	// 		here as we are not replacing the object created by the 
	// 		system...
	C.prototype.__proto__ = B.prototype


	var c = new C()

	c.x					// -> 1
	c.y					// -> 2



// Checking inheritance (instanceof)
// ---------------------------------
//
// An object is considered an instance of its' constructor and all other 
// constructors in the inheritance chain.

	c instanceof C		// -> true
	c instanceof B		// -> true
	c instanceof A		// -> true
	c instanceof Object // -> true

	c instanceof function X(){} 
						// -> false


// This also works for our manually created objects

	var cc = construct(C)

	cc instanceof C


// But this will not work outside the constructor model, i.e. if the right 
// parameter is not a function.

	var x = {}
	var y = Object.create(x)

	try{
		// this will fail as x is not a function...
		y instanceof x
	} catch(e){
		console.log('error')
	}


// Again to make this simpler to understand we will implement our own
// equivalent to instanceof:
	
	function isInstanceOf(obj, proto){
		return obj === Function && proto === Function ? true 
			: (isInstanceOf(proto, Function)
				&& (obj.__proto__ === proto.prototype ? true
					// NOTE: the last in this chain is Object.prototype.__proto__ 
					// 		and it is null
					: obj.__proto__ == null ? false
					// go down the chain...
					: isInstanceOf(obj.__proto__, proto)))
	}


	isInstanceOf(c, C)	// -> true
	isInstanceOf(c, B)	// -> true
	isInstanceOf(c, A)	// -> true
	isInstanceOf(c, Object)
						// -> true

	isInstanceOf(c, function X(){})
						// -> false
					

// Also take note of the following cases:

	Object instanceof Function
						// -> true
	Function instanceof Object
						// -> true
	Object instanceof Object
						// -> true
	Function instanceof Function
						// -> true


// Now, the fact that a function object is both a function and an object
// should be obvious:

	function f(){}

	f instanceof Function
						// -> true
	f instanceof Object
						// -> true



// Checking type (typeof)
// ----------------------
//
// This section is mainly here for completeness and to address several
// gotcha's.
//
// What typeof returns in JavaScript is not too useful and sometimes 
// even odd...

	typeof c			// -> 'object'

// This might differ from implementation to implementation but 
// essentially the main thing typeof is useful for is distinguishing
// between objects and non-objects (numbers, strings, ...etc.)

	// non-objects
	typeof 1			// -> 'number'
	typeof Infinity		// -> 'number'
	typeof 'a'			// -> 'string'
	typeof undefined	// -> 'undefined'

	// objects
	typeof {}			// -> 'object'
	typeof []			// -> 'object'

	// the odd stuff...
	typeof NaN			// -> 'number'
	typeof null			// -> 'object'
	typeof function(){}	// -> 'function'


// NOTE: the "non-object" term is not entirely correct here, they can
// 		be called "frozen" objects in ES5 speak, but that is outside the
// 		scope of this document.



// Methods and the value of 'this'
// -------------------------------
//
// A "method" is simply an attribute that references a function.

 	function f(){
		return this
 	}

	var o = { f: f }

// Thus we call the attribute .f of object o a "method" of object o.
//
//
// 'this' is a reserved word and is available in the context of a function
// execution, not just in methods, but what value it references depends
// on how that function is called...
// 'this' is mostly useful and used in methods.
// 
// A simple way to think about it is that 'this' always points to the 
// "context" of the function call.
//
// There are three distinct cases here:
// 	- function call / implicit context
// 	- new call / implicit context
// 	- method call / explicit context
//
//
// 1) function call (implicit)
//	In the first case the context is either global/window/module which 
//	ever is the root context in a given implementation or undefined in
//	ES5 strict mode

	f()					// -> window/global/module


//	Strict mode example:
//
	function strict_f(){
		'use strict'
		return this
	}

	strict_f()			// -> undefined


// 2) new call (implicit)
// 	Here as we have discussed before, 'this' is assigned a new object 
// 	with some special attributes set.

	new f()				// -> {}


// 3) method call (explicit)
// 	In the method call context this is set to the object from which the
// 	method is called, i.e. the object left of the '.' or [ ] attribute 
// 	access operators...

	o.f()				// -> o
	o['f']()			// -> o


// 	...or an explicitly passed to .call(..) / .apply(..) function methods

	f.call(o)			// -> o
	f.apply(o)			// -> o


// ES5 also defines a third way to make method calls: Function.bind which
// creates a new function where 'this' is bound to the supplied object

	var ff = f.bind(o)
	ff()				// -> o


// NOTE: all of the above 5 calls are the same.
// NOTE: the resulting from .bind(..) function will ignore subsequent
// 		.bind(..), .call(..) and .apply(..) method calls and 'this' will 
// 		always be the original bound object.
// NOTE: the difference between strict and "quirks" modes is in the 
// 		following:
// 		In quirks mode a function call is always done in the root 
// 		context, it's like implicitly calling a method of the global
// 		object:
//			f() === window.f()	
//						// -> true
//		In strict mode these are two different things, a function call
//		is done without a context ('this' is undefined) while calling
//		the same function via the global object is essentially a method
//		call, setting 'this' to what is to the left of the attribute 
//		access operator:
//			strict_f() !== window.strict_f()	
//						// -> true



// Common use-cases
// ----------------
//
// Several common object construction patterns:
//
// * Literal objects...

	var LiteralObject = {
		x: 1,

		method: function(a){
			return this.x * a
		},
	}

	var o = Object.create(LiteralObject)


// 	Advantages:
// 		- simple and non-verbose
// 		- fully introspective
// 		- flexible and non-restrictive
// 		- supports basic inheritance
// 	
// 	Disadvantages:
// 		- needs a seporate manual instance construction stage (no 
// 		  constructor)
// 		- does not provide support for some of the base language 
// 		  infrastructure, like type and instance checking



// * Constructor object...

	function ConstructorObject(){
		this.x = 1
	}
	ConstructorObject.prototype.method = function(a){
		return this.x * a
	}

	var o = new ConstructorObject()

// 	Advantages:
// 		- flexible
// 		- fully introspective
// 		- supports language mechanisms for type and instance checking
// 		- supports inheritance
// 	
// 	Disadvantages:
// 		- more complicated than the literal notation
// 		- needs manual work to support inheritance, making it more even
// 		  complicated
// 		- does not provide support for multiple inheritance



// * Walled objects / Walled data

	function ObjectConstructor(){
		// private data and functions...
		var x = 1

		// the actual object defining both public data and methods...
		return {
			y: 2,

			method: function(a){
				// use the private and public data...
				return this.y * x * a
			},
		}
	}

	var o = ObjectConstructor() 


// 	Advantages:
// 		- supports hiding data from the user
// 	
// 	Disadvantages:
// 		- non-introspective
// 		- added complexity
// 		- makes inheritance and extending very complicated and in some
// 		  cases impossible
// 		- copies code rather than reuses it
// 		- does not provide support for some of the base language 
// 		  infrastructure, like type and instance checking
//
//	NOTE: mostly inspired by languages supporting internal strict data 
// 		context restrictions (e.g. private data) from the C++ family, 
// 		e.g. C++, Java, C# and friends...
//	NOTE: this style is called "defensive" coding by some sources, 
//		including this one ;)
// 	NOTE: this approach has it's use-cases, mainly in code dealing with
// 		security, though general use of this pattern is not recommended 
// 		as it adds lots of limitations and complexity without giving 
// 		back any real benefits in the general case.




/*********************************************************************/
//
// NOTE: several topics available in ES5 are intentionally excluded 
// 		from this document, these include:
// 			- properties
// 			- freezing/sealing
// 		The general motivation for this is simple: they introduce 
// 		complexity and restrictions without giving any real benefits 
// 		in the common case.
//
// 		Cases where these features "might" be useful are:
// 			- language design / language extending
// 			- library code
// 		Neither of these is a common case and the use of these features
// 		for library code is debatable.
//
//
/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
