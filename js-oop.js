/**********************************************************************
* 
* The basics of JavaScript OOP
*
*
**********************************************************************/
//
// The basic prototype inheritance
// -------------------------------
//
// First we'll create a  basic object a

	var a = {
		x: 1,
		y: 2,
	} 

// Then we will create a new object using a as a "base" 

	var b = Object.create(a)
	b.z = 3

// The object b now has both access to it's own attributes ('z') and 
// attributes of a ('x' and 'y')

	b.x					// -> 1
	b.z					// -> 3

// What we see is that if the attribute is not found in the current 
// object it resolves to the object's "prototype" and so on, these 
// chians can of any length.
//
// NOTE: there is also a second mechanism available but we'll discuss 
// 		it a bit later in 
//
// A couple of easy ways to see these sets of attributes:
	
	Object.keys(b)		// -> z

	for(var k in b){ console.log(k) }
						// -> x, y, z

// Another way to test if the attribute is "local" ("own"):

	b.isOwnProperty('z')	// -> true
	b.isOwnProperty('x')	// -> false


// What happens under the hood is very simple:

	b.__proto__ === a	// -> true


// Thus, we could define our own create function like this:

	function clone(from){
		var o = {}
		o.__proto__ = from
		return o
	}

	var c = clone(b)

// Out of curiosity let's see if .__proto__ is defined on a basic object

	var x = {}

	x.__proto__			// -> {}

// Turns out it is, and it points to Object's prototype

	x.__proto__ === Object.prototye
						// -> true

// We will discuss what this means and how we can use this in the next 
// sections...
//
//
//
// The Constructor Mechanism
// -------------------------
//
// JavaScript provides a second, complementary mechanism to inherit 
// attributes, it resembles the class/object relationship in languages
// like C++ but this resemblance is on the surface only as it still 
// uses the same prototype mechanism as the above.  
//
// We will start by creating a constructor:
	
	function A(){
		this.x = 1
		this.y = 2
	}

// Technically a constructor is just a function, what makes it a 
// "constructor" is how we use it...

	var a = new A()


// what 'new' does here is:
// 	1) creates an empty object
// 	2) sets a bunch of attributes on it
// 	3) passes it to the constructor via 'this'
// 	4) after the constructor returns, this object is returned
//
// We could write an equivalent (simplified) function:

	function construct(func){
		var obj = {}

		// set some special attributes on obj...

		return func.apply(obj)
	}

	var b = construct(A)

// But what makes this interesting? At this point this all looks like 
// all we did is moved attribute from a literal object notation to a 
// constructor function, effectively adding complexity. What are we 
// getting back from this?
//
// Let's look at a number of attributes:

	a.__proto__		// -> {} 

	a.constructor	// -> [Function A]


// The answer lies in the attributes that are set on the object, lets 
// write a more complete reference implementation:
	
	function construct(func, args){
		var obj = {}

		obj.constructor = func
		obj.__proto__ = func.prototype

		var res = func.apply(obj, args)
		if(res instanceof Object){
			return res
		}

		return obj
	}

	var b = construct(A)

// Notice that we return the resulting object in a more complicated
// way, this will come in handy later.
// 
// Also notice that 'prototype' from the end of the previous section.
//
// First let us cover the default. Each time a function is created in
// JavaScript it will get a new empty object assigned to it's .prototype
// attribute.
// On the function level, in general, this is not used, but this is used
// when we use the function as a constructor.
//
// As we can see from the code above, the resulting object's .__proto__
// points to the constructor's .prototype, from the previous section 
// this means that attributes accessed via that object are resolved to 
// the prototype.
// In the default case this is true.
//
// So if we add stuff to the constructor's .prototype they should get 
// resolved from the object

	A.prototype.x = 123
	a.constructor.prototype.y = 321
	a.__proto__.z = 333

	// for illustration, some object own attributes
	a.x = 'a!'
	b.x = 'b!'

	a.x				// -> 'a!'
	a.y				// -> 321
	a.z				// -> 333

// These values are accessible from all objects constructed by A since
// all of them point to A with both the .constructor and .__proto__ 
// attributes

	b.x				// -> 'b!'
	b.y				// -> 321
	b.z				// -> 333



// Double inheritance:
// -------------------
//
// NOTE: this might be implementation specific. Tested and works in IE11, V8
//
// There are actually three sources where JavaScript looks for attributes:
// 	1) the actual object
// 	2) .__proto__ 
// 		as coverd in the first section
// 	3) .constructor.prototype 
// 		as explained in the previous section

	var O = { 
		o: 0
	}

	function A(){}
	A.prototype.a = 1

	var a = new A()
	a.__proto__ = o

// Now we can access both attributes inherited from 'O' and 'A'...

	a.o				// -> 0
	a.a				// -> 1


// The check is done specifically in this order, thus attributes can 
// "shadow" other attributes defined later in the chain.
//
// To show this let us define an attribute with the same name on both 
// 'O' and 'A':

	O.x = 'came from O'
	A.prototype.x = 'came from A'

	a.x				// -> 'came from O'


// In both inheritance mechanisms, each step is checked via the same 
// rules recursively, this enables inheritance chains.
//
// We will create a cahin:
//
// 		c -> b -> a
//

	var a = {x: 1}
	var b = Object.create(a)
	b.y = 2
	var c = Object.create(b)
	
	c.x				// -> 1
	c.y				// -> 2


// Creating an inheritance chain via the constructor mechanism is a bit
// more involved, and there are multiple ways to do this...
//
// Here we will create a similar chian:
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
	B.prototype.y = 2

	function C(){}
	// NOTE: this is safer than Object.create as it does not overwrite
	// 		the original object and thus will affect all existing 
	// 		instances of C, if any were created before this point...
	C.prototype.__proto__ = B.prototype

	var c = new C()

	c.x				// -> 1
	c.y				// -> 2



// Checking inheritance (instanceof)
// ---------------------------------
//
// An object is considered an instance of its' constructor and all other 
// constructors in the inheritance chain.

	c instanceof C	// -> true
	c instanceof B	// -> true
	c instanceof A	// -> true
	c instanceof Object
					// -> true


// This also works for manually created objects

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
		return proto instanceof Function 
			&& (obj.__proto__ === proto.prototype ? true
				// NOTE: the last in this chain is Object.prototype.__proto__ 
				// 		and it is null
				: obj.__proto__ == null ? false
				// go down the chian...
				: isInstanceOf(obj.__proto__, proto))
	}

	isInstanceOf(c, C)	// -> true
	isInstanceOf(c, B)	// -> true
	isInstanceOf(c, A)	// -> true
	isInstanceOf(c, Object)
						// -> true
	isInstanceOf(c, function X(){})
						// -> false


// Checking type (typeof)
// ----------------------
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



// Methods and the value of 'this'
// -------------------------------
//
// A method is simply an attribute that references a function.

 	function f(){
 		console.log(this)
 		this.a = 1
 	}

	var o = { f: f }

// Thus we call the attribute .f of object o a method.
//
//
// 'this' is a reserved word and is available in the context of a function
// execution, not just in methods, but what value it references depends
// on how that function is called...
// 
// a simple way to think about is that 'this' always points to the 
// "context" of the function call.
//
// This context can be:
// 	- implicit
// 		- root context
 			f()
						// 'window', 'global' or 'module' is implied, 
						// in strict mode this is null.
						// the same as:
						// 		window.f()
// 		- 'new' context
 			new f()		// here a context will be created and passed to
 						// 'f's 'this', for more details on what 'new'
 						// does see: "The Constructor Mechanism" section.
// 	- explicit:
// 		- the object on the left side of "." or the [ ] operators:
 			o.f()		// o is the context
 			o['f']()	// the same as the above
// 		- the object explicitly passed to .call(..) or .apply(..) methods
// 		  as first argument:
 		  	f.call(o)	// o is the context
 		  	f.apply(o)	// o is the context
//
//
//
// 				
/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
