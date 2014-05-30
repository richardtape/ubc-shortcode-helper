( function( $ ) {

	"use strict";

	$( function (){

		// Uses the Event Manager which adds Javascript Hooks for WordPress
		wp.hooks.addFilter( 'shortcodeMenu.menu.menu', addColumnMenuItem, 10 );

		// Test for the media modal html for the columns
		wp.hooks.addFilter( 'shortcodeHTML.output', generateHTMLForColumnsShortcode, 10 );


		/**
		 * Add a sub item
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Grid Columns
		 * @since 1.0
		 * @param (array) dropdownMenu - the items that are in the shortcode dropdown already
		 * @param (object) editor - the main editor to which this is being added. Needed by callbacks.
		 * @return (array) dropdownMenu - modified dropdown menu
		 */
		
		function addColumnMenuItem( dropdownMenu, editor )
		{

			// Set up our item to add
			var itemToAdd = {
				text: 'Columns',
				onclick: function() {
					columnOverlay( editor );
				}
			};

			// Add it to the menu array
			dropdownMenu.push( itemToAdd );

			// Ship it back to the filter
			return dropdownMenu;

		};


		/**
		 * Callback for when the menu item is clicked
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Grid Columns
		 * @since 1.0
		 * @param 
		 * @return 
		 */
		
		function columnOverlay( editor )
		{

			editor.windowManager.open( {
				title: 'Insert Random Shortcode',
				body: [
					{
						type: 'textbox',
						name: 'textboxName',
						label: 'Text Box',
						value: '30'
					},
					{
						type: 'textbox',
						name: 'multilineName',
						label: 'Multiline Text Box',
						value: 'You can say a lot of stuff in here',
						multiline: true,
						minWidth: 300,
						minHeight: 100
					},
					{
						type: 'listbox',
						name: 'listboxName',
						label: 'List Box',
						'values': [
							{text: 'Option 1', value: '1'},
							{text: 'Option 2', value: '2'},
							{text: 'Option 3', value: '3'}
						]
					}
				],
				onsubmit: function( e ) {
					editor.insertContent( '[random_shortcode textbox="' + e.data.textboxName + '" multiline="' + e.data.multilineName + '" listbox="' + e.data.listboxName + '"]');
				}
			});

		};
		

		/**
		 * Generate the shortcode for the columns based on what the user has enetered in the fields
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Grid Columns
		 * @since 1.0
		 * @param (string) defaultHTML - the currently set html
		 * @param (object) attrs - the data the user has entered in the media manager
		 * @return (string) defaultHTML - modified html
		 */

		function generateHTMLForColumnsShortcode( defaultHTML, attrs )
		{

			return '<h1>YAAAY</h1>';

		};

	} );

}( jQuery ) );