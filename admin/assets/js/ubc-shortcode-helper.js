( function( $ ) {

	"use strict";

	$( function () {

		// Add our UBC Shortcode Helper button to TinyMCE
		tinymce.PluginManager.add( 'ubc_shortcode_helper', function( editor, url ) {

			// TinyMCE requires an array of objects, so let's start with a fresh array
			var defaultMenu = [];

			// Now, run the actual menu through a js filter so we can add to this via additional plugins
			var internalMenu = wp.hooks.applyFilters( 'shortcodeMenu.menu.menu', defaultMenu, editor );

			editor.addButton( 'ubc_shortcode_helper', {

				text: shortcodeMenu.text,
				icon: shortcodeMenu.icon,
				type: shortcodeMenu.type,
				menu: internalMenu

			} );

		} );

	} );

}( jQuery ) );