/**********************************************************************
* 
* Simple Snake 
*
* This code is designed to illustrate the non-intuitive approach to an
* implementation, building a snake game as a cellular automaton rather
* than the more obvious, set of entities (OOP) or a number of sets 
* of procedures and data structures, directly emulating the "tactile" 
* perception of the game, i.e. independent field, snakes, walls, apples
* and their interactions.
*
* In this approach there are no entities, no snakes, no apples, no 
* walls, just a set of cells in a field and cell behaviours per game 
* step:
* 	- empty cells, apples and walls just sit there
* 	- "snake" cells:
* 		- decrement age
* 		- if age is 0 clear cell
* 		- if cell has direction (i.e. snake head)
* 			- if target cell is red (apple) increment age
* 			- color new cell in direction:
* 				- set age on to current age + 1
* 				- set direction to current
* 			- clear direction
*
* NOTE: that in the above description some details are omitted for 
* 		clarity...
*
*
* This code is structured in a scalable and introspective way:
* 	- Snake object is reusable as a prototype enabling multiple games
* 		to run at the same time
* 	- Snake implements an open external control scheme, i.e. it does not 
* 		impose a specific way to implementing the way to control the game
* 	- Simple (but not trivial) code and code structure
* 	- Introspective: no hidden/masked state or functionality
* 	- No external dependencies
*
*
* Goals:
* 	- Show that the "intuitive" is not the only approach or is not 
* 		necessarily the simplest...
* 	- Show one approach to a scalable yet simple architecture
* 	- Illustrate several programming patterns and approaches:
* 		- concatinative 
* 			- see how Snake methods are implemented and how they are used
* 				in setup(..)...
* 			- see Snake.call(..) and Snake.apply(..) methods and how they
* 				enable extending the code inline...
* 		- meta-programming 
* 			see: makeEvent(..)
* 		- event-oriented-programming
* 			see Snake events and how they are used in setup(..) to extend
* 			the basic game logic...
* 	- Show the use of several HTML5/CSS3 features including appCache, 
* 		touch events and keyboard events and handling...
*
*
*
**********************************************************************/

var VERSION = '2.0'


/*********************************************************************/

function makeEvent(handler_attr){
	return function(func){
		if(func === null){
			delete this[handler_attr]

		} else if(func instanceof Function){
			var handlers = this[handler_attr] = this[handler_attr] || []
			handlers.push(func)

		} else {
			var that = this
			var args = [].slice.call(arguments)
			this[handler_attr]
				&& this[handler_attr]
					.forEach(function(handler){ handler.apply(that, args) })
		}
		return this
	}
}

var Snake = {
	config: {
		field_size: 32,
		interval: 150,
	},

	_field: null,
	_cells: null,
	players: null,
	field_size: null,

	get random_point(){
		var cells = this._cells
		var l = cells.length
		var w = this.field_size.width

		do {
			var i = Math.floor(Math.random() * l)
		} while(cells[i].classList.length > 0)

		return {
			x: i%w,
			y: Math.floor(i/w),
		}
	},
	get random_direction(){
		return ('nesw')[Math.floor(Math.random() * 4)] },

	// utils...
	call: function(func){
		return func.apply(this, [].slice.call(arguments, 1)) },
	apply: function(func, args){ 
		return func.apply(this, args) },
	normalize_point: function(point){
		point = point || {}
		var w = this.field_size.width
		var x = point.x % w
		x = x < 0 ? (x + w) : x
		var h = this.field_size.height
		var y = point.y % h
		y = y < 0 ? (y + h) : y
		return { x: x, y: y }
	},

	// system...
	setup: function(field, size, interval){
		this.config.field_size = size || this.config.field_size
		this.config.interval = interval || this.config.interval
		field = field || this._field
		field = this._field = typeof(field) == typeof('str') ? document.querySelector(field)
			: field
		this._make_field()
		this._cells = [].slice.call(field.querySelectorAll('td'))
		this.field_size = {
			width: field.querySelector('tr').querySelectorAll('td').length,
			height: field.querySelectorAll('tr').length,
		}
		this.players = {}
		return this
			.appleEaten(null)
			.snakeKilled(null)
	},
	_make_field: function(w){
		var l = []
		l.length = w || this.config.field_size
		l.fill('<td/>')
		this._field.innerHTML = 
			`<table class="field" cellspacing="0">\n${ 
				l.map(function(){ 
					return `  <tr> ${ l.join('') } </tr>` 
				}).join('\n') 
			}\n</table>`
	},
	_tick: function(){
		var that = this
		var l = this._cells.length
		var w = this.field_size.width
		var h = this.field_size.height
		var tick = this.__tick = (this.__tick + 1 || 0)
		var directions = 'neswn'

		this._cells.forEach(function(cell, i){
			var color = cell.style.backgroundColor

			// skip cells we touched on this tick...
			if(cell.tick == tick){
				return
			}

			// snake...
			if(cell.age != null){
				// handle cell age...
				if(cell.age == 0){
					delete cell.age
					cell.classList.remove('snake')
					cell.style.backgroundColor = ''

				} else {
					cell.age -= 1
				}

				// snake head -> move...
				var direction = cell.direction
				if(directions.indexOf(direction) >= 0){
					// turn...
					if(that.players[color] != ''){
						var turn = that.players[color] || ''
						var j = turn == 'left' ? directions.indexOf(direction) - 1
							: directions.indexOf(direction) + 1
						j = j < 0 ? 3 : j
						direction = directions[j]
						that.players[color] = ''
					}

					// get next cell index...
					var next = 
						direction == 'n' ? 
							(i < w ? l - w + i : i - w)
						: direction == 's' ? 
							(i > (l-w-1) ? i - (l-w) : i + w)
						: direction == 'e' ? 
							((i+1)%w == 0 ? i - (w-1) : i + 1)
						: (i%w == 0 ? i + (w-1) : i - 1)
					next = that._cells[next]

					var age = cell.age
					var move = false

					// special case: other snake's head -> kill both...
					if(next.direction){
						var other = next.style.backgroundColor
						next.classList.remove('snake')
						next.style.backgroundColor = ''
						// NOTE: we are not deleteing .direction here as 
						//		we can have upto 4 snakes colliding...
						next.direction = ''
						that.snakeKilled(other, next.age+1)
						that.snakeKilled(color, age+2)
						delete next.age

					// apple -> increment age...
					} else if(next.classList.contains('apple')){
						age += 1
						move = true
						next.classList.remove('apple')
						that.appleEaten(color, age+2)

					// empty -> just move...
					} else if(next.classList.length == 0){
						move = true

					// other -> kill...
					} else {
						that.snakeKilled(color, age+2)
					}

					// do the move...
					if(move){
						next.tick = tick
						next.style.backgroundColor = color
						next.classList.add('snake')
						next.age = age + 1
						next.direction = direction
					}

					delete cell.direction
				}
			}
			cell.tick = tick
		})
		this.tick(tick)
	},

	// constructors...
	snake: function(color, age, point, direction){
		point = this.normalize_point(point || this.random_point)

		var head = this._cells[point.x + point.y * this.field_size.width]
		head.style.backgroundColor = color
		head.classList.add('snake')
		head.direction = direction || this.random_direction
		head.age = (age || 5) - 1
		this.players[color] = ''

		return this
			.snakeBorn(color)
	},
	apple: function(point){
		point = this.normalize_point(point || this.random_point)
		var c = this._cells[point.x + point.y * this.field_size.width]
		c.classList.add('apple')
		c.style.backgroundColor = ''
		return this
	},
	wall: function(point, direction, length){
		direction = direction || this.random_direction
		point = this.normalize_point(point || this.random_point)
		var x = point.x
		var y = point.y
		length = length || Math.random() * this.field_size.width

		while(length > 0){
			var c = this._cells[x + y * this.field_size.width]
			c.classList.add('wall')
			c.style.backgroundColor = ''

			x += direction == 'e' ? 1
				: direction == 'w' ? -1
				: 0
			x = x < 0 ? this.field_size.width + x
				: x % this.field_size.width
			y += direction == 'n' ? -1
				: direction == 's' ? 1
				: 0
			y = y < 0 ? this.field_size.height + y
				: y % this.field_size.height
			length -= 1
		}

		return this
	},
	level: function(level){
		var that = this
		level.forEach(function(wall){
			that.wall.apply(that, wall) })
		return this
	},

	// events...
	snakeKilled: makeEvent('__killHandlers'),
	snakeBorn: makeEvent('__birthHandlers'),
	appleEaten: makeEvent('__appleEatenHandlers'),
	tick: makeEvent('__tickHandlers'),
	gameStarted: makeEvent('__startHandlers'),
	gameStopped: makeEvent('__stopHandlers'),

	// actions...
	start: function(t){
		this.__timer = this.__timer 
			|| setInterval(this._tick.bind(this), t || this.config.interval || 200)
		// reset player control actions...
		var that = this
		Object.keys(this.players)
			.forEach(function(k){ that.players[k] = '' })
		return this
			.tick()
			.gameStarted()
	},
	stop: function(){
		clearInterval(this.__timer)
		delete this.__timer
		delete this.__tick
		return this
			.gameStopped()
	},
	pause: function(){
		return this.__timer ? this.stop() : this.start() },
	left: function(color){ 
		this.players[color || Object.keys(this.players)[0]] = 'left' 
		return this
	},
	right: function(color){
		this.players[color || Object.keys(this.players)[0]] = 'right' 
		return this
	},
}



/*********************************************************************/
// control event handlers...

var KEY_CONFIG = {
	' ': ['pause'],
	n: setup,
	ArrowLeft: ['left'],
	ArrowRight: ['right'], 
	// IE compatibility...
	Left: ['left'],
	Right: ['right'],
	'?': function(){
		this
			.stop()
			.call(showHints) },
}
function makeKeyboardHandler(snake){
	return function(event){
		clearHints()
		var action = KEY_CONFIG[event.key]
		action 
			&& (action instanceof Function ?
					action.call(snake)
				: action[0] in snake ?
					snake[action[0]].apply(snake, action.slice(1))
				: null) }}

var __DEBOUNCE = false
var __DEBOUNCE_TIMEOUT = 100
function makeTapHandler(snake){
	return function(event){
		// prevent clicks and touches from triggering the same action 
		// twice -- only handle the first one within timeout...
		// NOTE: this should not affect events of the same type...
		if(__DEBOUNCE && event.type != __DEBOUNCE){ return }
		__DEBOUNCE = event.type
		setTimeout(function(){ __DEBOUNCE = false }, __DEBOUNCE_TIMEOUT)

		clearHints()
		// top of screen (1/8)...
		;(event.clientY || event.changedTouches[0].pageY) <= (document.body.clientHeight / 8) ? 
			setup()
		// bottom of screen 1/8...
		: (event.clientY || event.changedTouches[0].pageY) >= (document.body.clientHeight / 8)*8 ? 
			Snake.pause()
		// left/right of screen...
		: (event.clientX || event.changedTouches[0].pageX) <= (document.body.clientWidth / 2) ? 
			Snake.left() 
			: Snake.right() }}


//---------------------------------------------------------------------
// misc stuff...

function showHints(){
	document.body.classList.add('hints') }
function clearHints(){
	document.body.classList.remove('hints') }
function digitizeBackground(snake, walls){
	snake._cells.forEach(function(c){
		var v = Math.floor(Math.random() * 6)
		// bg cell...
		c.classList.length == 0 ?
			(c.style.backgroundColor = 
				`rgb(${255 - v}, ${255 - v}, ${255 - v})`)
		// wall...
		: walls && c.classList.contains('wall') ?
			(c.style.backgroundColor = 
				`rgb(${220 - v*2}, ${220 - v*2}, ${220 - v*2})`)
		// skip the rest...
		: null })
	return snake
}


//---------------------------------------------------------------------

var __CACHE_UPDATE_CHECK = 5*60*1000
var __HANDLER_SET = false
function setup(snake, timer, size){
	snake = snake || Snake

	// levels...
	var A = Math.round((size || snake.config.field_size)/8)
	var Level = {
		W3: [
			[null, null, A*6],
			[null, null, A*6],
			[null, null, A*6],
		],
		Halves: [
			[null, null, A*8],
		],
		Quarters: [
			[null, 's', A*8],
			[null, 'e', A*8],
		],
		Random3: [[], [], []],

		get random(){
			var l = Object.keys(this)
				.filter(function(e){ return e != 'random' })
			do {
		   		var level = this[l[ Math.round(Math.random()*l.length) ]]
			} while(!(level instanceof Array))
			return level
		},
	}

	function showScore(color, age){
		score = snake.__top_score = 
			(!snake.__top_score || snake.__top_score.score < age) ?
				{
					color: color || '',
					score: age || 0,
				}
				: snake.__top_score
		snake._field.setAttribute('score', score.score)
		snake._field.setAttribute('snake', score.color)
		snake._field.setAttribute('state', (
			score.score == age && score.color == color) ? '(current)' : '')
	}

	// setup event handlers (only once)...
	if(!__HANDLER_SET){
		document.querySelectorAll('.version')
			.forEach(function(e){ e.innerHTML = VERSION })

		// control handlers...
		document.addEventListener('keydown', makeKeyboardHandler(snake))
		document.addEventListener('touchstart', makeTapHandler(snake))
		//document.addEventListener('mousedown', makeTapHandler(snake))

		// cache updater...
		var appCache = window.applicationCache
		if(appCache
				&& appCache.status != appCache.UNCACHED){
			appCache.addEventListener('updateready', function(){
				if(appCache.status == appCache.UPDATEREADY){
					console.log('CACHE: new version available...')
					appCache.swapCache()

					confirm('New version ready, reload?')
						&& location.reload()
				}
			})
			setInterval(function(){ appCache.update() }, __CACHE_UPDATE_CHECK)
		}

		__HANDLER_SET = true
	}

	// setup the game...
	return snake
		// prepare the field/game...
		.setup('.simplesnake', size, timer)
		.call(digitizeBackground, snake)
		.call(function(){
			this.__snake_apples = []
			return this
		})

		// load level...
		.level(Level.random)

		// game events / meta game rules...
		// reconstruct eaten apples...
		.appleEaten(function(color, age){ 
			this.apple() 
			showScore(color, age)
		})
		// one apple per snake...
		.snakeBorn(function(color){
			this.__snake_apples.indexOf(color) < 0
				&& this.apple()	
				&& this.__snake_apples.push(color) })
		// reconstruct snakes and pause game...
		// XXX for multiplayer reconstruct the snake on timeout and do 
		// 		not pause...
		.snakeKilled(function(color, age){ 
			this
				.pause()
				.snake(color, 3) 
			showScore(color, 3)
		})
		// indicate game state...
		.gameStarted(function(){ 
			this._field.classList.remove('paused') })
		.gameStopped(function(){ 
			this._field.classList.add('paused') })

		// game eleemnts...
		.apple()
		.snake('blue', 3)
}



/**********************************************************************
* vim:set ts=4 sw=4 spell :                                          */
