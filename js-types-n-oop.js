
/**********************************************************************
* 
* JavaScript types and objects
*
*
**********************************************************************/


// Basic values
// ============
//
// numbers
	var integer = 123
	var floating_point = 3.1415
	var hex = 0xFF

// strings
	var string = 'string'
	var another_string = "also a string"
	var template = `
		a template string.
		this can include \\n's
		also summorts expansions ${ '.' }`

// boolieans
	var t = true
	var f = false

// nulls
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
	


// Objects
// =======
//
//

// Prototypes and inheritance
// --------------------------
//
//

// Constructors
// ------------
//
//


/**********************************************************************
*                                                vim:set ts=4 sw=4 : */
