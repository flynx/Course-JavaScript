/**********************************************************************
* 
* The basics of JavaScript OOP
*
*
**********************************************************************/
//
// The value of 'this'
// -------------------
//
 	function f(){
 		console.log(this)
 		this.a = 1
 	}
	var o = { f: f }

// 
// 'this' is always the "context" of the function call, in JS a context
// can be:
// 	- implicit
// 		- root context
 			f()			// 'window' or 'module' is implied, this is 
 						//	equivalent to: window.f()
// 		- 'new' context
 			new f()		// here a context will be created and passed to
 						//	'f's 'this', for more details on what 'new'
 						//	does see the next section.
// 	- explicit:
// 		- the object on the left side of "." or the [ ] attribute access:
 			o.f()		// o is the context
 			o['f']()	// the same as the above
// 		- the object explicitly passed to .call(..) or .apply(..) methods
// 		  as first argument:
 		  	f.call(o)	// o is the context
//
//
//
// What's 'new'?
// -------------
//
 	function O(){
 		this.attr = 123
 	}
 	var o = new O()

//
// 'new' creates a new context object and passes it to the function 
// being called (the constructor), this new object has several special
// attributes set:
// 	o.constructor	-- references the object (constructor) used to 
// 						construct the object o (instance)
// 	o.__proto__		-- references the constructor prototype, same as:
 							o.constructor.prototype === o.__proto__
// 						this is used to identify the object via:
 							o instanceof O
//
// The 'new' expression returns the context object after it has been
// populated by the constructor function.
//
// NOTE: when using 'new', the function/constructor return value is 
// 		ignored.
//
//
// The values set on 'this' by the constructor are instance attributes,
// i.e. they are stored in the specific instance being created.
//
// NOTE: calling the constructor is not required, but not calling it
// 		will not run the initialization code that would otherwise 
// 		populate the object. i.e. no instance values will be created.
// 
//
// The instance has another type of attribute accessible through it, an 
// attribute that's not stored in the object, but rather in it's 
// prototype (o.__proto__), or rather the constructor's prototype 
// (o.constructor.prototype). For more details see the next section.
//
//
//
// The object's 'prototype'
// ------------------------
//
 	function f(){}
 	console.log(f.prototype)			// f {}

//
// The unique prototype object is created on every function definition.
// The prototype is instance-like of the function to which it is assigned.
//
// NOTE: since the prototype has .__proto__ set to Object, technically
// 		it's not a strict instance of the type it defines, so:
 			f.prototype instanceof f
// 		will return false.
//
// Each unresolved attribute access on the "instance" will resolve to its
// prototype (o.__proto__ or o.constructor.prototype). 
//
 	O.prototype.x = 321
 	console.log(o.x)					// 321

//
// Since the prototype is a JS object that adheres to the same rules as 
// any other object, if the attr is not resolved in it directly, it will 
// be searched in its prototype, and so on.
// This principle enables us to implement inheritance.
//
	var OO = function(){
		// call the base constructor...
		O.call(this)
	}
	// chain the two prototypes...
	OO.prototype = new O()
	// this is to make things coherent for oo below...
	OO.prototype.constructor = OO

	var oo = new OO()

	console.log(oo.x)					// 321
	console.log(oo.constructor.name)	// 'OO'

//
// So in the example above local attributes (in 'oo') will be searched 
// first, then oo.__proto__ (instance of O), then in O.prototype, and 
// then in Object.prototype.
//
// 	oo -> oo.__proto__ -> (oo.__proto__).__proto__ -> ...
//
//
//
// 				
/**********************************************************************
* vim:set ts=4 sw=4 :                                                */
