<?php

	/**
	 * Admin plugin class
	 *
	 * @author Richard Tape <@richardtape>
	 * @package UBC Shortcode Helper
	 * @since 0.1
	 */
	
	
	class UBC_Shortcode_helper_Admin
	{

		/**
		 * Instance of this class.
		 *
		 * @since    1.0.0
		 * @var      object
		 */
		
		protected static $instance = null;

		/**
		 * Slug of the plugin screen.
		 *
		 * @since    1.0.0
		 * @var      string
		 */
		
		protected $plugin_screen_hook_suffix = null;


		/**
		 * Initialize the plugin by loading admin scripts & styles and adding a
		 * settings page and menu.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		private function __construct()
		{


			$plugin = UBC_Shortcode_Helper::get_instance();
			$this->plugin_slug = $plugin->get_plugin_slug();

			// Load admin style sheet and JavaScript for the options
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles_options' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts_options' ) );

			// Load our post write screen js/css
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles_write_screen' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts_write_screen' ) );

			// Add the options page and menu item.
			add_action( 'admin_menu', array( $this, 'add_plugin_admin_menu' ) );

			// Add an action link pointing to the options page.
			$plugin_basename = plugin_basename( plugin_dir_path( realpath( dirname( __FILE__ ) ) ) . $this->plugin_slug . '.php' );
			add_filter( 'plugin_action_links_' . $plugin_basename, array( $this, 'add_action_links' ) );
			
			// Add the TinyMCE Button
			add_filter( 'admin_head', array( $this, 'addButtonIfUserCanAddShortcodes' ) );


			//
			// For the media manager modal approach
			//
			add_action( 'admin_enqueue_scripts', array( $this, 'custom_add_script' ) );
			add_filter( 'media_view_strings', array( $this, 'custom_media_string' ), 10, 2 );
			add_action( 'print_media_templates', array( $this, 'print_media_templates' ) );

		}/* __construct() */


		/**
		 * Return an instance of this class.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return    object    A single instance of this class.
		 */
		
		public static function get_instance()
		{

			// If the single instance hasn't been set, set it now.
			if ( null == self::$instance ){
				self::$instance = new self;
			}

			return self::$instance;

		}/* get_instance() */


		/**
		 * Register and enqueue admin-specific style sheet.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return    null    Return early if no settings page is registered.
		 */
		
		public function enqueue_admin_styles_options()
		{

			if ( ! isset( $this->plugin_screen_hook_suffix ) ){
				return;
			}

			$screen = get_current_screen();

			if ( $this->plugin_screen_hook_suffix == $screen->id ){
				wp_enqueue_style( $this->plugin_slug .'-admin-styles', plugins_url( 'assets/css/admin-options.css', __FILE__ ), array(), UBC_Shortcode_Helper::VERSION );
			}

		}/* enqueue_admin_styles_options() */


		/**
		 * Register and enqueue admin-specific JavaScript.
		 *
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return    null    Return early if no settings page is registered.
		 */
		
		public function enqueue_admin_scripts_options()
		{

			if ( ! isset( $this->plugin_screen_hook_suffix ) ){
				return;
			}

			$screen = get_current_screen();

			if ( $this->plugin_screen_hook_suffix == $screen->id ){
				wp_enqueue_script( $this->plugin_slug . '-admin-script', plugins_url( 'assets/js/admin-options.js', __FILE__ ), array( 'jquery' ), UBC_Shortcode_Helper::VERSION );
			}

		}/* enqueue_admin_scripts_options() */


		/**
		 * Load our required js for the main post write/edit screen
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function enqueue_admin_scripts_write_screen()
		{

			// Bail early if we're not on a valid screen
			if( !$this->canCurrentScreenShowWriteJSCSS() ){
				return;
			}

			wp_enqueue_script( $this->plugin_slug . '-admin-script', plugins_url( 'assets/js/admin-write-screen.js', __FILE__ ), array( 'jquery' ), UBC_Shortcode_Helper::VERSION );


		}/* enqueue_admin_scripts_write_screen() */


		/**
		 * Load our required CSS for the main post write/edit screen
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function enqueue_admin_styles_write_screen()
		{

			if( !$this->canCurrentScreenShowWriteJSCSS() ){
				return;
			}

		}/* enqueue_admin_styles_write_screen() */


		/**
		 * Helper method to fetch which screens to show the write js/css
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return (array) $screensOnWhichToShowWriteAssets - the screen IDs on which to show the main JS/CSS
		 */
		
		private function get_screens_to_show_write_js_css()
		{

			// Provide screen IDs to which to add the JS/CSS (i.e. result from get_current_screen()->id e.g. post)
			$screensOnWhichToShowWriteAssets = array(
				'post',
				'page'
			);

			// Run it through a filter so we can add to this from other plugins (which may add CPTs etc.)
			$screensOnWhichToShowWriteAssets = apply_filters( $this->plugin_slug . 'screens_on_which_to_show_write_assets', $screensOnWhichToShowWriteAssets );

			// Ship
			return $screensOnWhichToShowWriteAssets;

		}/* get_screens_to_show_write_js_css() */
		

		/**
		 * Determine if the passed screen is valid to show the js/css assets
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param (object) $screen - a WP_Screen object
		 * @return (bool) - whether the passed screen is allowed to show the js/css
		 */
		
		public function can_screen_show_write_js_css( $screen = false )
		{

			// Ensure we have been passed a screen object
			if( !$screen ){
				return new WP_Error( '1', 'can_screen_show_write_js_css requires a valid screen object' );
			}

			// Fetch all screens where this is valid to add the js/css
			$validScreens = $this->get_screens_to_show_write_js_css();

			// If we get nothing back or it's empty, no dice
			if( !$validScreens || !is_array( $validScreens ) || empty( $validScreens ) ){
				return false;
			}

			// If the passed screen object is in the valid list of screens, we're golden
			if( in_array( $screen->id, array_values( $validScreens ) ) ){
				return true;
			}

			// Default to false
			return false;

		}/* can_screen_show_write_js_css() */
		
		
		/**
		 * Determine if the *current* screen is valid to show the js/css
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return (bool) - whether the current screen is to show the js/css
		 */
		
		public function canCurrentScreenShowWriteJSCSS()
		{

			// The current screen
			$screen = get_current_screen();

			// Is the current screen a valid one?
			$validScreen = $this->can_screen_show_write_js_css( $screen );

			return $validScreen;

		}/* canCurrentScreenShowWriteJSCSS() */
		

		/**
		 * Register the administration menu for this plugin into the WordPress Dashboard menu.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function add_plugin_admin_menu()
		{
			
			$this->plugin_screen_hook_suffix = add_options_page(
				__( 'Shortcode Helper', $this->plugin_slug ),
				__( 'Shortcode Helper', $this->plugin_slug ),
				'manage_options',
				$this->plugin_slug,
				array( $this, 'display_plugin_admin_page' )
			);

		}/* add_plugin_admin_menu() */


		/**
		 * Render the settings page for this plugin.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function display_plugin_admin_page()
		{

			include_once( 'views/admin.php' );

		}/* display_plugin_admin_page() */


		/**
		 * Add settings action link to the plugins page.
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function add_action_links( $links )
		{

			return array_merge(
				array(
					'settings' => '<a href="' . admin_url( 'options-general.php?page=' . $this->plugin_slug ) . '">' . __( 'Settings', $this->plugin_slug ) . '</a>'
				),
				$links
			);

		}/* add_action_links() */


		/**
		 * Add the main button to the editor (the one which has the dropdown of possible shortcodes)
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 0.1
		 * @param null
		 * @return null
		 */
		
		public function addButtonIfUserCanAddShortcodes()
		{

			if ( !current_user_can( 'edit_posts' ) && !current_user_can( 'edit_pages' ) || ( 'true' !== get_user_option( 'rich_editing' ) ) ) {
				return;
			}
	
			add_filter( 'mce_external_plugins', array( $this, 'addTinyMCEPlugin' ) );
			add_filter( 'mce_buttons', array( $this, 'registerTinyMCEButton' ) );

		}/* addButtonIfUserCanAddShortcodes() */


		/**
		 * Add the TinyMCE plugin
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 1.0
		 * @param (array) $plugin_array - the list of TinyMCE Plugins 
		 * @return (array) $plugin_array - the list of TinyMCE Plugins 
		 */
		
		public function addTinyMCEPlugin( $plugin_array )
		{

			// THis is the JS file which registers the dropdown button
			$plugin_array['ubc_shortcode_helper'] = plugins_url( 'assets/js/ubc-shortcode-helper.js', __FILE__ );

			$buttonArray = array(
				'text' => 'Shortcode Helper',
				'icon' => false,
				'type' => 'menubutton',
				'menu' => array()
			);

			$buttonArray = apply_filters( $this->plugin_slug . 'shortcode_menu_array', $buttonArray );

			wp_enqueue_script( 'event_manager', plugins_url( 'assets/js/event-manager.js', __FILE__ ), array( 'jquery' ), UBC_Shortcode_Helper::VERSION );
			wp_enqueue_script( 'ubc_shortcode_helper_test', plugins_url( 'assets/js/ubc-shortcode-helper-test.js', __FILE__ ), array( 'jquery' ), UBC_Shortcode_Helper::VERSION );

			// We localize it so we're able to build the button dynamically through a filter
			wp_localize_script( 'event_manager', 'shortcodeMenu', $buttonArray );

			return $plugin_array;

		}/* addTinyMCEPlugin() */
		

		/**
		 * Register the TinyMCE Button
		 *
		 * @author Richard Tape <@richardtape>
		 * @package UBC Shortcode Helper
		 * @since 1.0
		 * @param (array) $buttons - List of configured TinyMCE Buttons
		 * @return (array) $buttons - List of configured TinyMCE Buttons
		 */
		
		public function registerTinyMCEButton( $buttons )
		{

			array_push( $buttons, 'ubc_shortcode_helper' );

			return $buttons;

		}/* registerTinyMCEButton() */
		
		





		function custom_add_script()
		{

			wp_enqueue_script( 'media-manager-modal-js', plugins_url( 'assets/js/media-manager-modal.js', __FILE__ ), array( 'media-views' ), false, true );
			wp_enqueue_style( 'media-manager-modal-css', plugins_url( 'assets/css/media-manager-modal.css', __FILE__ ), array(), UBC_Shortcode_Helper::VERSION );

		}/* custom_add_script() */

		function custom_media_string( $strings, $post )
		{

			$strings['customMenuTitle'] 	= __( 'Insert Shortcode', $this->plugin_slug );
			$strings['customButton'] 		= __( 'Insert into post', $this->plugin_slug );

			return $strings;

		}/* custom_media_string() */


		function print_media_templates()
		{

			?>

			<script type="text/html" id="tmpl-custom-shortcode-setting">
				<div id="ubc-shortcode-helper-container">
				
					<div id="ubc-shortcode-helper-list-container">
							
					<ul>
						<li><a href="#ubc-shortcode-helper-columns" data-fields_to_show="ubc-shortcode-helper-columns" title="<?php _e( 'Columns', $this->plugin_slug ); ?>"><?php _e( 'Columns', $this->plugin_slug ); ?></a></li>
						<li><a href="#ubc-shortcode-helper-accordion" data-fields_to_show="ubc-shortcode-helper-accordion" title="<?php _e( 'Accordion', $this->plugin_slug ); ?>"><?php _e( 'Accordion', $this->plugin_slug ); ?></a></li>
					</ul>

					</div>

					<div id="ubc-shortcode-helper-content-container">
						
						<div id="ubc-shortcode-helper-field-default-message" class="ubc-shortcode-fields"><?php _e( 'Please select which shortcode you would like to insert from the menu on the left.', $this->plugin_slug ); ?></div>

						<div id="ubc-shortcode-helper-columns" class="ubc-shortcode-fields">
							
							<span class="backforward-button-holder">
								<a href="#" class="back-step-button">&larr; Back</a>
								<a href="#" class="forward-step-button">&rarr; Forward</a>
							</span>

							<form id="ubc-shortcode-helper-columns-form">

								<div id="inner-column-content" class="shortcode-content-fields">

									<label class="setting" data-setting="number_of_columns">
										<span><?php _e( 'Number of columns', $this->plugin_slug ); ?></span>
										<input id="number_of_columns" name="number_of_columns" type="text" value="{{ data.number_of_columns }}" placeholder="4" class="small-input" />
									</label>

									<button class="button" id="submitnumcols" value="submitnumcols" disabled="disabled">
										<?php esc_attr_e( 'Continue' ); ?>
									</button>

								</div>

								<div class="column-content-template" style="display: none;">
									<div class="col-details">
										<label class="setting" data-setting="itemspan">
											<span><?php _e( 'Span', $this->plugin_slug ); ?></span>
											<input name="itemspan" id="itemspan1" type="text" value="{{ data.itemspan }}" placeholder="1" class="small-input" />
										</label>
										<label class="setting" data-setting="itemcontent">
											<span><?php _e( 'Column Content', $this->plugin_slug ); ?></span>
											<textarea name="itemcontent" id="itemcontent1" value="{{ data.itemcontent }}" class=""></textarea>
										</label>
									</div>
								</div>

							</form>

						</div>


						<div id="ubc-shortcode-helper-accordion" class="ubc-shortcode-fields">Accordion</div>

					</div>

				</div>
			</script>

			<?php

		}/* print_media_templates() */


	}/* class UBC_Shortcode_helper_Admin */
