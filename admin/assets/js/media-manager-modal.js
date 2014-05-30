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
		this.props = new Backbone.Model({ number_of_columns: '', column_content: {} });
		this.props.on( 'change:number_of_columns', this.refresh, this );
		this.props.on( 'change:column_content', this.refresh, this );

	},
	
	// called each time the model changes
	refresh: function() {

		// update the toolbar
		this.frame.toolbar.get().refresh();

	},
	
	// called when the toolbar button is clicked
	customAction: function(){

		// Get all stored 
		var attrs = this.props.attributes;

		// Build the 'html' which in this case will be the shortcode
		var dataToSendToEditor = this.buildHTMLForEditorFromAttributes( attrs );

		// Send that data to the editor
		wp.media.editor.insert( dataToSendToEditor );

	},

	// Builds the shotcode based on the attributes in the model
	buildHTMLForEditorFromAttributes: function( attrs ){

		var defaultHTML = '<p>Any joy?</p>';
		var htmlFromAttributes = wp.hooks.applyFilters( 'shortcodeHTML.output', defaultHTML, attrs );

		return htmlFromAttributes;

	}
	
});

// custom toolbar : contains the buttons at the bottom
wp.media.view.Toolbar.Custom = wp.media.view.Toolbar.extend({

	initialize: function() {

		_.defaults( this.options, {
			event: 'insert_into_post_button',
			close: false,
			items: {
				insert_into_post_button: {
					text: wp.media.view.l10n.customButton, // added via 'media_view_strings' filter,
					style: 'primary',
					priority: 80,
					requires: false,
					click: this.customAction
				}
			},
		});

		wp.media.view.Toolbar.prototype.initialize.apply( this, arguments );

	},

	// called each time the model changes
	refresh: function() {

		// @TODO: Create a JS Action in here which will allow other plugins to hook in and disable/enable the main submit button

		// you can modify the toolbar behaviour in response to user actions here
		// disable the button if there is no custom data
		var number_of_columns = this.controller.state().props.get('number_of_columns');
		this.get('insert_into_post_button').model.set( 'disabled', ! number_of_columns );
		
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
	template:  wp.media.template('custom-shortcode-setting'),
	
	// @TODO: We really don't need this firing on everything
	// bind view events
	events: {
		'input':  'updateModelWithEnteredData',
		'keyup':  'updateModelWithEnteredData',
		'change': 'updateModelWithEnteredData'
	},

	// initialize: function() {
		
	//     // create an input
	//     // SW: I'm seeing an error here that `make` doesn't exist
	//     this.input = this.make( 'input', {
	// 		type:  'text',
	// 		value: this.model.get('number_of_columns')
	// 	});
		
	// 	// insert it in the view
	//     this.$el.append(this.input);
		
	//     // re-render the view when the model changes
	//     this.model.on( 'change:number_of_columns', this.render, this );
	// },
	
	// render: function(){
	//     this.input.value = this.model.get('number_of_columns');
	//     return this;
	// },
	
	updateModelWithEnteredData: function( event ) {

		this.model.set( event.target.id, event.target.value );

	}

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
	
	createCustomToolbar: function( toolbar ){

		toolbar.view = new wp.media.view.Toolbar.Custom({
			controller: this
		});

	},

	// @TODO: Move all of this jQuery into proper backbone data handling?
	// @TODO: Run an action so we can hook in and each plugin can create it's own template
	customContent: function(){

		// this view has no router
		this.$el.addClass( 'hide-router' );

		// custom content view
		var view = new wp.media.view.Custom({
			controller: this,
			model: this.state().props
		});

		this.content.set( view );

		var that = this;

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
		jQuery( '#number_of_columns' ).on( 'keyup', function(){

			var thisInput = jQuery( this );
			var thisValue = thisInput.val();
			var submitButton = jQuery( '#submitnumcols' );

			// If they haven't typed an integer, silly billy
			if( !thisValue || isNaN( thisValue ) || thisValue == ''  ){
				submitButton.attr( 'disabled', 'disabled' );
			}else{
				submitButton.removeAttr( 'disabled' );
			}

			// wp.media.view.Custom.model.set( 'number_of_columns', 'sausage' );
		
		} );

		jQuery( '#ubc-shortcode-helper-columns-form' ).on( 'submit', function( event ){
			event.preventDefault();
			createColumnContent();
		} );

		// When the number of columns 'continue' button is pressed
		jQuery( '#submitnumcols, .forward-step-button' ).on( 'click', function( event ){

			event.preventDefault();
			createColumnContent();

		} );

		function createColumnContent(){

			var thisInput = jQuery( '#number_of_columns' );
			var thisValue = thisInput.val();

			// Cache the current content so we can go 'back'
			var contentContainer = jQuery( '#inner-column-content' );
			var currentContent = contentContainer.html();
			that.orgiginalContent = currentContent;

			// Also grab the passed data
			var formData = jQuery( '#ubc-shortcode-helper-columns-form' ).serialize();
			that.originalFormData = formData;

			// We need to create x-number entry boxes (where x = thisValue) for the user to input their content for each column
			// each column has content and a 'span'
			var templateContent = jQuery( '.column-content-template' ).html();

			// Fade out the current content
			contentContainer.fadeOut( 100, function(){

				// Empty it
				contentContainer.empty();

				contentContainer.html( '<span class="empty-content">&nbsp;</span>' );
				jQuery( '.forward-step-button' ).hide();

				jQuery( '.backforward-button-holder' ).css( 'display', 'block' );
				jQuery( '.back-step-button' ).fadeIn();

				// Now clone the template multiple times and insert
				for( var i = 0; i < thisValue; i++ ){
					
					var thisContentToAdd = jQuery( templateContent );

					var newIndex = i+1;

					// Adjust the IDs
					var regex = /^(.*)(\d)+$/i;

					thisContentToAdd.find('*').each( function(){
						var thisID = this.id || "";
						var match = thisID.match(regex) || [];
						if (match.length == 3) {
							this.id = match[1] + (newIndex);
							this.name = match[1] + (newIndex);
						}
						
					} );

					jQuery( thisContentToAdd ).insertAfter( '.empty-content' );
				}

				if( that.savedColumnFieldsData && that.savedColumnFieldsData !== 'undefined' )
					loadSerializedData( 'ubc-shortcode-helper-columns-form', that.savedColumnFieldsData );

				contentContainer.fadeIn();

			} );

		}

		// When the back-button is clicked
		jQuery( '.back-step-button' ).on( 'click', function( event ){

			event.preventDefault();

			// Cache current setup so we can go 'forward' again should we wish
			var currentFieldsContentContainer = jQuery( '.shortcode-content-fields' );
			var currentFieldsContent = currentFieldsContentContainer.html();
			that.currentFieldsContent = currentFieldsContent;

			var columnFieldsData = jQuery( '#ubc-shortcode-helper-columns-form' ).serialize();
			that.savedColumnFieldsData = columnFieldsData;

			// Hide the fields
			currentFieldsContentContainer.fadeOut( 100, function(){

				// Empty the container
				currentFieldsContentContainer.empty();

				// Now re-show the original content
				currentFieldsContentContainer.html( that.orgiginalContent );

				loadSerializedData( 'ubc-shortcode-helper-columns-form', that.originalFormData );

				jQuery( '.forward-step-button' ).show();
				jQuery( '.back-step-button' ).hide();

				// Fade it back in
				currentFieldsContentContainer.fadeIn(100);

			} );

		} );

		function loadSerializedData( formId, data )
		{
			
			var tmp = data.split('&'), dataObj = {};
			
			// Bust apart the serialized data string into an obj
			for (var i = 0; i < tmp.length; i++)
			{
				var keyValPair = tmp[i].split('=');
				dataObj[keyValPair[0]] = keyValPair[1];
			}

			// Loop thru form and assign each HTML tag the appropriate value
			jQuery('#' + formId + ' :input').each(function(index, element) {
				if (dataObj[jQuery(this).attr('name')])
					jQuery(this).val(dataObj[jQuery(this).attr('name')]);
			});

		}

	}

});