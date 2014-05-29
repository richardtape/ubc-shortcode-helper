// for debug : trace every event
// var originalTrigger = wp.media.view.MediaFrame.Post.prototype.trigger;
// wp.media.view.MediaFrame.Post.prototype.trigger = function(){
//     console.log('Event Triggered:', arguments);
//     originalTrigger.apply(this, Array.prototype.slice.call(arguments));
// }


// custom state : this controller contains your application logic
wp.media.controller.Custom = wp.media.controller.State.extend({

	initialize: function(){
		// this model contains all the relevant data needed for the application
		this.props = new Backbone.Model({ custom_data: '' });
		this.props.on( 'change:custom_data', this.refresh, this );
	},
	
	// called each time the model changes
	refresh: function() {
		// update the toolbar
		this.frame.toolbar.get().refresh();
	},
	
	// called when the toolbar button is clicked
	customAction: function(){
		console.log(this.props.get('custom_data'));
	}
	
});

// custom toolbar : contains the buttons at the bottom
wp.media.view.Toolbar.Custom = wp.media.view.Toolbar.extend({
	initialize: function() {
		_.defaults( this.options, {
			event: 'custom_event',
			close: false,
			items: {
				custom_event: {
					text: wp.media.view.l10n.customButton, // added via 'media_view_strings' filter,
					style: 'primary',
					priority: 80,
					requires: false,
					click: this.customAction
				}
			}
		});

		wp.media.view.Toolbar.prototype.initialize.apply( this, arguments );
	},

	// called each time the model changes
	refresh: function() {
		// you can modify the toolbar behaviour in response to user actions here
		// disable the button if there is no custom data
		var custom_data = this.controller.state().props.get('custom_data');
		this.get('custom_event').model.set( 'disabled', ! custom_data );
		
		// call the parent refresh
		wp.media.view.Toolbar.prototype.refresh.apply( this, arguments );
	},
	
	// triggered when the button is clicked
	customAction: function(){
		this.controller.state().customAction();
	}
});

// custom content : this view contains the main panel UI
wp.media.view.Custom = wp.media.View.extend({
	className: 'media-custom',
	// Checkout wp-includes/media-templates.php and the print_media_templates action
	// for how to set the templates
	// template:  wp.media.template('embed-image-settings'),
	template:  wp.media.template('custom-shortcode-setting'),
	
	// // bind view events
	// events: {
	// 	'input':  'custom_update',
	// 	'keyup':  'custom_update',
	// 	'change': 'custom_update'
	// },

	// initialize: function() {
	// 	console.log( "wp.media.view.Custom initialize" );
		
	//     // create an input
	//     // SW: I'm seeing an error here that `make` doesn't exist
	//     this.input = this.make( 'input', {
	// 		type:  'text',
	// 		value: this.model.get('custom_data')
	// 	});
		
	// 	// insert it in the view
	//     this.$el.append(this.input);
		
	//     // re-render the view when the model changes
	//     this.model.on( 'change:custom_data', this.render, this );
	// },
	
	// render: function(){
	// 	console.log( "wp.media.view.Custom render" );
	//     this.input.value = this.model.get('custom_data');
	//     return this;
	// },
	
	// custom_update: function( event ) {
	// 	console.log( "wp.media.view.Custom custom_update" );
	// 	this.model.set( 'custom_data', event.target.value );
	// }
});


// supersede the default MediaFrame.Post view
var oldMediaFrame = wp.media.view.MediaFrame.Post;
wp.media.view.MediaFrame.Post = oldMediaFrame.extend({

	initialize: function() {
		oldMediaFrame.prototype.initialize.apply( this, arguments );
		
		this.states.add([
			new wp.media.controller.Custom({
				id:         'my-action',
				menu:       'default', // menu event = menu:render:default
				content:    'custom',
				title:      wp.media.view.l10n.customMenuTitle, // added via 'media_view_strings' filter
				priority:   200,
				toolbar:    'main-my-action', // toolbar event = toolbar:create:main-my-action
				type:       'link'
			})
		]);

		this.on( 'content:render:custom', this.customContent, this );
		this.on( 'toolbar:create:main-my-action', this.createCustomToolbar, this );
		this.on( 'toolbar:render:main-my-action', this.renderCustomToolbar, this );
	},
	
	createCustomToolbar: function(toolbar){
		toolbar.view = new wp.media.view.Toolbar.Custom({
			controller: this
		});
	},

	customContent: function(){

		// this view has no router
		this.$el.addClass('hide-router');

		// custom content view
		var view = new wp.media.view.Custom({
			controller: this,
			model: this.state().props
		});

		this.content.set( view );

		// On initialize, show the default message
		jQuery( '#ubc-shortcode-helper-field-default-message' ).addClass( 'showing-fields' ).fadeIn();

		// When a menu item on the left is clicked, show the relevant fields
		jQuery( '#ubc-shortcode-helper-list-container a' ).on( 'click', function(){
			
			event.preventDefault();

			var thisLink = jQuery( this );
			var clickedID = thisLink.data( 'fields_to_show' );

			// Remove currently clicked link
			jQuery( '.shortcode-a-showing' ).removeClass( 'shortcode-a-showing' );

			// Add to the clicked link
			thisLink.addClass( 'shortcode-a-showing' );

			// Fade out the current one then show the new fields
			jQuery( '.showing-fields' ).removeClass( 'showing-fields' ).fadeOut( 100, function(){
				jQuery( '#' + clickedID ).addClass( 'showing-fields' ).fadeIn();
			} );

		} );


		// When someone types in a number into the # columns box, enable the continue button
		jQuery( '#numcols' ).on( 'keyup', function(){

			var thisInput = jQuery( this );
			var thisValue = thisInput.val();
			var submitButton = jQuery( '#submitnumcols' );

			// If they haven't typed an integer, silly billy
			if( !thisValue || isNaN( thisValue ) || thisValue == ''  ){
				submitButton.attr( 'disabled', 'disabled' );
			}else{
				submitButton.removeAttr( 'disabled' );
			}
		
		} );

		// When the number of columns 'continue' button is pressed
		jQuery( '#submitnumcols' ).on( 'click', function(){

			var thisInput = jQuery( '#numcols' );
			var thisValue = thisInput.val();

			// Cache the current content so we can go 'back'
			var contentContainer = jQuery( '#ubc-shortcode-helper-columns' );
			var currentContent = contentContainer.html();

			// We need to create x-number entry boxes (where x = thisValue) for the user to input their content for each column
			// each column has content and a 'span'
			var templateContent = jQuery( '.column-content-template' ).html();

			// Fade out the current content
			contentContainer.fadeOut( 100, function(){

				// Empty it
				contentContainer.empty();

				contentContainer.html( '<span class="content-holder">Content</span>' );

				// Now clone the template multiple times and insert
				for( var i = 0; i < thisValue; i++ ){
					templateContent.clone().insertAfter( '.content-holder' );
				}

				contentContainer.fadeIn();

			} );

		} );

	}

});