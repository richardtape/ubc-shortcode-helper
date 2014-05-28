<?php

	/**
	 * Plugin Name: UBC Shortcode Helper
	 * Plugin URI: https://github.com/ubc/ubc-shortcode-helper
	 * Version: 0.1
	 * Description: Provides a way to help people write shortcodes (this plugin simply provides the setup, each plugin which adds a shortcode should add it's own data)
	 * Author: Richard Tape, CTLT, UBC
	 * Author URI: http://ctlt.ubc.ca
	 * Text Domain: ubc_shortcode_helper
	 * License: GPLv2
	 *
	 * @author Richard Tape <@richardtape>
	 * @package UBC Shortcode Helper
	 * @since 0.1
	 */


	// Stop someone loading this file directly. Naughty.
	if ( ! defined( 'ABSPATH' ) )
	{

		die( '-1' );
	
	}

	// Go ahead and load our main plugin class
	require_once( plugin_dir_path( __FILE__ ) . 'public/class-ubc-shortcode-helper.php' );


	// Register hooks that are fired when the plugin is activated or deactivated.
	// When the plugin is deleted, the uninstall.php file is loaded.
	register_activation_hook( __FILE__, array( 'UBC_Shortcode_Helper', 'activate' ) );
	register_deactivation_hook( __FILE__, array( 'UBC_Shortcode_Helper', 'deactivate' ) );

	add_action( 'plugins_loaded', array( 'UBC_Shortcode_Helper', 'get_instance' ) );


	/*----------------------------------------------------------------------------*
	 * Dashboard and Administrative Functionality
	 *----------------------------------------------------------------------------*/

	
	if ( is_admin() && ( ! defined( 'DOING_AJAX' ) || ! DOING_AJAX ) )
	{

		require_once( plugin_dir_path( __FILE__ ) . 'admin/class-ubc-shortcode-helper-admin.php' );

		add_action( 'plugins_loaded', array( 'UBC_Shortcode_helper_Admin', 'get_instance' ) );

	}


?>