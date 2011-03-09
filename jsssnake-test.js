function test(){
	var field = Field("field")

	// TODO UI...

	// setup a wall...
	for(var i=8; i < 20; i++){
		field.Wall(field.cell(12, i))
	}

	// apple and apple creation on callback...
	field.Apple(field.cell(10, 4))
	field.on_apple_eaten = function(){
		field.Apple(field.cell(13, 6))
		// remove the event handler...
		field.on_apple_eaten = null
	}

	// snake 0 script...
	// test general control and being killed...
	var s0 = field.Snake('black', field.cell(2, 2), 's', 3)
	setTimeout(function(){s0.left()}, 3000)
	setTimeout(function(){s0.right()}, 6000)

	// snake 1 script...
	// test general controls and killing...
	var s1 = field.Snake('blue', field.cell(6, 2), 's', 5)
	setTimeout(function(){s1.right()}, 6000)

	// snake 2 script...
	// test apple eating...
	var s2 = field.Snake('silver', field.cell(7, 4), 'e', 2)
	setTimeout(function(){s2.right()}, 5000)
	setTimeout(function(){s2.right()}, 6000)

	// snake 3 script...
	// test n/s wall traversal...
	var s3 = field.Snake('green', field.cell(15, 2), 'n', 4)
	setTimeout(function(){s3.right()}, 2000)
	setTimeout(function(){s3.right()}, 3000)

	// snake 4 script...
	// test l/r wall traversal...
	var s4 = field.Snake('gold', field.cell(2, 15), 'w', 4)
	setTimeout(function(){s4.right()}, 2500)
	setTimeout(function(){s4.right()}, 3500)
	setTimeout(function(){s4.right()}, 5000)

	// general game commands...
	field.start(500)
	setTimeout(function(){field.stop()}, 28000)
	setTimeout(function(){field.reset()}, 30000)


	// test the Game object...
	setTimeout(function(){
		var game = JSSnakeGame(field)

		game.Wall()
		game.Wall()
		game.Wall()
		game.Wall()

		game.Apple()
		game.Apple()
		game.Apple()
		game.Apple()
	}, 8000)

	// test for special cases...
	setTimeout(function(){
		var game = JSSnakeGame(field)

		game.field.reset()
		for(var i=0; i < game.field.cells.length; i++)
			game.Wall(game.field.Cell(i), 3, 'n')
		game.field.reset()
		for(var i=0; i < game.field.cells.length; i++)
			game.Wall(game.field.Cell(i), 3, 's')
		game.field.reset()
		for(var i=0; i < game.field.cells.length; i++)
			game.Wall(game.field.Cell(i), 3, 'e')
		game.field.reset()
		for(var i=0; i < game.field.cells.length; i++)
			game.Wall(game.field.Cell(i), 3, 'w')
	}, 21000)

	setTimeout(function(){
		var game = JSSnakeGame(field)

		game.field.reset()
		for(var i=0; i < game.field.cells.length; i++)
			game.Apple(game.field.Cell(i))
	}, 22000)

	setTimeout(function(){
		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			game.levels.sand()
		}, 100)

		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			game.levels.walls()
		}, 2000)

		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			game.levels.dashed(20, 2)
		}, 4000)

		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			game.levels.dashed(15)
		}, 6000)

		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			game.levels.dashed(5, 18)
		}, 8000)


		setTimeout(function(){
			var game = JSSnakeGame(Field("field"))
			game.field.reset()
			setInterval(function(){
				game.field.reset()
				game.levels.walls()

				var APPLES = 4

				for(var i=0; i < APPLES; i++)
					game.Apple()
			}, 1000)
		}, 10000)
	}, 24000)
}

// vim:set ts=4 sw=4 spell :
