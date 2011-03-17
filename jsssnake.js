var DEBUG = true

function log(text){
	document.getElementById('log').innerHTML += text + '<br>'
}

var Field = function(field_id){
	return ({
		// XXX HACK: get this from CSS...
		APPLE_COLOR: 'red',
		WALL_COLOR: 'gray',
		FIELD_COLOR: 'white',
		TICK: 200,

		// interface...
		init: function(field_id, on_kill, on_apple_eaten){
			this.field = document.getElementById(field_id)

			// this depends on topology...
			// NOTE: we consider that the field may not change during operation...
			this.cells = this.field.getElementsByTagName("td")
			this.height = this.field.getElementsByTagName("tr").length

			this.cell_count = this.cells.length
			this.width = this.cell_count / this.height

			this.on_kill = on_kill
			this.on_apple_eaten = on_apple_eaten

			this._timer = null

			this.reset()

			// rotation tables...
			this._cw = {
				'n': 'e', 
				's': 'w',
				'e': 's',
				'w': 'n'
			}
			this._ccw = {
				'n': 'w', 
				's': 'e',
				'e': 'n',
				'w': 's'
			}

			return this
		},
		// setup/reset the field to it's original state.
		reset: function(){
			this._snakes = {}
			this._tick = 0
			this.stop()
			for(var i=0; i < this.cells.length; i++){
				var cell = this.Cell(i)
				cell.o.style.backgroundColor = this.FIELD_COLOR
			}
		},

		// do a single step...
		step: function(){
			var cells = this.cells

			for(var i=0; i < cells.length; i++){
				var cell = this.Cell(i)
				// identify the object...
				if(this.is_snake(cell)){
					this.Snake(cell.o.style.backgroundColor, cell).step()
				}
			}
			this._tick += 1
		},
		start: function(tick){
			var that = this
			if(tick === null){
				tick = this.TICK
			}
			if(this._timer === null){
				this._timer = setInterval(function(){that.step()}, tick)
			}
		},
		stop: function(){
			if(this._timer === null){
				return
			}
			clearInterval(this._timer)
			this._timer = null
		},

		// get a cell helper...
		Cell: function(n){
			var that = this
			var cells = this.cells
			return ({
				// NOTE: this will be null if a cell does not exist.
				o: cells[n],
				index: n,
				// NOTE: these are cyclic...
				n: function(){
					var t = n - that.width
					if(t < 0)
						t = that.cells.length + t
					return that.Cell(t)
				},
				s: function(){
					var t = n + that.width
					if(t > that.cells.length-1)
						t = t - that.cells.length
					return that.Cell(t)
				},
				e: function(){
					var t = n + 1
					if(Math.floor(t/that.width) > Math.floor(n/that.width))
						t = t - that.width
					return that.Cell(t)
				},
				w: function(){
					var t = n - 1
					if(Math.floor(t/that.width) < Math.floor(n/that.width))
						t = t + that.width
					return that.Cell(t)
				}
			})
		},
		// get a cell by it's coordinates...
		cell: function(x, y){
			return this.Cell(x + (y-1) * this.width)
		},

		// add a snake to the field...
		// XXX BUG: size of 1 makes the snake endless...
		Snake: function(color, cell, direction, size){
			var that = this

			// draw the snake if it does not exist...
			if(this._snakes[color] == null){
				cell.o.style.backgroundColor = color
				cell.o.age = size
				this._snakes[color] = {
					'direction':direction,
					'size': size
				}
			}

			// NOTE: the only things this uses from the above scope is color and that.
			// NOTE: color is the onlu thing that can't change in a snake.
			return ({
				// XXX BUG: the last cell of a dead snake lives an extra tick...
				kill: function(){
					// this will disable moving and advancing the snake...
					that._snakes[color].size = 0
					if(that.on_kill != null){
						that.on_kill(that)
					}
				},
				step: function(){
					var direction = that._snakes[color].direction
					var size = that._snakes[color].size
					var target = cell[direction]()

					// skip a cell if it's already handled at this step.
					if(cell.o.moved_at == that._tick){
						return
					}

					// do this only for the head...
					if(parseInt(cell.o.age) == size){
						// handle field bounds...
						if(target.o == null){
							alert('out of bounds!')
							return
						} 
						// kill conditions: walls and other snakes...
						if(that.is_snake(target) || that.is_wall(target)){
							// XXX move this to a separate action
							this.kill()
							return
						}
						// apple... 
						if(that.is_apple(target)){
							// grow the snake by one...
							// XXX move this to a separate action
							that._snakes[color].size += 1
							size = that._snakes[color].size
							if(that.on_apple_eaten != null){
								that.on_apple_eaten(that)
							}
						}
						// all clear, do the move...
						target.o.style.backgroundColor = color
						target.o.age = size
						target.o.moved_at = that._tick
						cell.o.age = size - 1

					} else { 
						if(cell.o.age <= 1) {
							cell.o.style.backgroundColor = that.FIELD_COLOR
						}
						cell.o.age = parseInt(cell.o.age) - 1
					}
				},

				// user interface...
				left: function(){
					that._snakes[color].direction = that._ccw[that._snakes[color].direction]
				},
				right: function(){
					that._snakes[color].direction = that._cw[that._snakes[color].direction]
				}
			})
		},
		is_snake: function(cell){
			var snakes = this._snakes
			var color = cell.o.style.backgroundColor

			for(var c in snakes){
				if(c == color)
					return true
			}
			return false
		},

		Apple: function(cell){
			cell.o.style.backgroundColor = this.APPLE_COLOR
			return cell
		},
		is_apple: function(cell){
			return cell.o.style.backgroundColor == this.APPLE_COLOR
		},

		Wall: function(cell){
			cell.o.style.backgroundColor = this.WALL_COLOR
			return cell
		},
		is_wall: function(cell){
			return cell.o.style.backgroundColor == this.WALL_COLOR
		},

		is_empty: function(cell){
			return cell.o.style.backgroundColor == this.FIELD_COLOR
		}
	}).init(field_id)
}

// this defines the basic game logic and controls the rules and levels...
/*
	NOTE: it is recommended to create game objects in the folowing order:
		1) walls
		2) apples
		3) players
 */
function JSSnakeGame(field){

	var game = {
		field: field,
		TICK: 300,

		// this enables snakes of the same colors...
		SIMILAR_COLORS: false,
		used_colors: function(){
			// this is a workaround the inability to directly create an object
			// with field names not a literal identifier or string...
			var res = {}
			res[field.FIELD_COLOR] = true
			res[field.WALL_COLOR] = true
			res[field.APPLE_COLOR] = true
			return res
		}(),

		// utility methods...
		_random_empty_cell: function(){
			// NOTE: if we are really unlucky, this will take 
			//       really long, worse, if we are infinitely unlucky
			//       this will take an infinite amount of time... (almost)
			var field = this.field
			var i = field.cells.length-1
			var l = i
			while(true){
				var c = field.Cell(Math.round(Math.random()*l))
				if(field.is_empty(c))
					return c
				i--
				if(i == 0)
					return null
			}
		},
		// key handler...
		// functions:
		// 	- control snake - dispatch player-specific keys to player-specific snake
		// 	- create player - two unused keys pressed within timeout, random color 
		//
		// modes:
		// 	- player add
		// 	- game control
		//
		// NOTE: modes can intersect...
		// NOTE: modes are game state dependant...
		_keyHandler: function(evt){
			var key = window.event ? event.keyCode : evt.keyCode

			return true
		},
		// create a new player...
		// NOTE: direction and position are optional...
		// XXX BUG: players should not get created facing a wall directly...
		Player: function(name, ccw_button, cw_button, color, cell, direction, size){
			if(!this.SIMILAR_COLORS && this.used_colors[color] == true){
				// error: that the color is already used...
				return
			}
			// XXX register controls...

			if(direction == null){
				direction = ['n', 's', 'e', 'w'][Math.round(Math.random()*3)]
			}
			if(cell === null){
				cell = this._random_empty_cell()
				if(cell === null)
					return
			}
			// create a snake...
			this.used_colors[color] = true
			return this.field.Snake(color, cell, direction, size)
		},
		// NOTE: position is optional...
		Apple: function(cell){
			// place an apple at a random and not occupied position...
			var c = this._random_empty_cell()
			if(c === null)
				return
			return this.field.Apple(c)
			
		},
		// NOTE: all arguments are optional...
		Wall: function(cell, len, direction){
			// generate random data for arguments that are not given...
			if(cell == null){
				cell = this._random_empty_cell()
				if(cell === null)
					return
			}
			if(direction == null){
				direction = ['n', 's', 'e', 'w'][Math.round(Math.random()*3)]
			}
			if(len == null){
				if(direction == 'n' || direction == 's')
					var max = this.field.height 
				else
					var max = this.field.width 
				len = Math.round(Math.random()*(max-1))
			}
			// place a wall...
			for(var i=0; i < len; i++){
				field.Wall(cell)
				cell = cell[direction]()
			}
		},

		// level generators and helpers...
		levels: {
			dotted: function(n){
				for(var i=0; i < n; i++)
					game.Wall(null, 1, null)
			},
			dashed: function(n, length){
				if(length == null)
					length = 3
				for(var i=0; i < n; i++)
					game.Wall(null, length, null)
			},
			// specific level styles...
			sand: function(){
				this.dotted(Math.round(game.field.cells.length/20))
			},
			walls: function(){
				this.dashed(
					Math.round(game.field.cells.length/90), 
					Math.min(
						game.field.width, 
						game.field.height)-2)
			}
		},

		start: function(){
			// start the game...
			field.start(this.TICK)
		},
		stop: function(){
			field.stop()
		}
	}

	field.on_apple_eaten = function(){game.Apple()}
	field.on_kill = function(snake){game.used_colors[snake.color] = false}
	
	//document.onkeyup = function(evt){return game._keyHandler(evt)}

	return game
}

// vim:set ts=4 sw=4 spell :
