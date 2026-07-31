export interface ScaffoldParams {
  name: string;
  slug: string;
  description: string;
  author: string;
  version?: string;
  features?: string[];
}

export class WpTemplates {
  /**
   * 1. Standard WordPress Plugin Boilerplate
   */
  public static pluginBoilerplate(p: ScaffoldParams): Record<string, string> {
    const v = p.version || "1.0.0";
    const mainPhp = `<?php
/**
 * Plugin Name:       ${p.name}
 * Plugin URI:        https://forge-ai.local/plugins/${p.slug}
 * Description:       ${p.description}
 * Version:           ${v}
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            ${p.author}
 * License:           GPL-2.0-or-later
 * Text Domain:       ${p.slug}
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

final class ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_Plugin {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->define_constants();
        $this->init_hooks();
    }

    private function define_constants() {
        define('${p.slug.toUpperCase().replace(/-/g, '_')}_VERSION', '${v}');
        define('${p.slug.toUpperCase().replace(/-/g, '_')}_PATH', plugin_dir_path(__FILE__));
        define('${p.slug.toUpperCase().replace(/-/g, '_')}_URL', plugin_dir_url(__FILE__));
    }

    private function init_hooks() {
        add_action('plugins_loaded', [$this, 'load_textdomain']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    public function load_textdomain() {
        load_plugin_textdomain('${p.slug}', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function enqueue_admin_assets() {
        wp_enqueue_style('${p.slug}-admin', ${p.slug.toUpperCase().replace(/-/g, '_')}_URL . 'assets/css/admin.css', [], ${p.slug.toUpperCase().replace(/-/g, '_')}_VERSION);
    }
}

function ${p.slug.replace(/-/g, '_')}() {
    return ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_Plugin::instance();
}

${p.slug.replace(/-/g, '_')}();
`;

    const uninstallPhp = `<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Cleanup plugin options & custom tables
delete_option('${p.slug}_settings');
`;

    const readmeTxt = `=== ${p.name} ===
Contributors: ${p.author}
Tags: wordpress, plugin, ai, forge
Requires at least: 6.4
Tested up to: 6.7
Stable tag: ${v}
License: GPLv2 or later

${p.description}

== Installation ==
1. Upload \`${p.slug}\` to the \`/wp-content/plugins/\` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
`;

    return {
      [`${p.slug}/${p.slug}.php`]: mainPhp,
      [`${p.slug}/uninstall.php`]: uninstallPhp,
      [`${p.slug}/readme.txt`]: readmeTxt,
      [`${p.slug}/assets/css/admin.css`]: `/* Admin Styles for ${p.name} */\n.forge-plugin-card { padding: 15px; border-radius: 8px; background: #fff; }`,
    };
  }

  /**
   * 2. Gutenberg Block Boilerplate
   */
  public static gutenbergBlock(p: ScaffoldParams): Record<string, string> {
    const blockJson = JSON.stringify({
      "$schema": "https://schemas.wp.org/trunk/block.json",
      "apiVersion": 3,
      "name": `forge/${p.slug}`,
      "version": "1.0.0",
      "title": p.name,
      "category": "widgets",
      "icon": "superhero",
      "description": p.description,
      "attributes": {
        "content": { "type": "string", "default": "Hello Gutenberg Block!" }
      },
      "editorScript": "file:./build/index.js",
      "style": "file:./build/index.css"
    }, null, 2);

    const blockPhp = `<?php
/**
 * Block Name: ${p.name}
 */
if (!defined('ABSPATH')) exit;

function register_block_${p.slug.replace(/-/g, '_')}() {
    register_block_type(__DIR__);
}
add_action('init', 'register_block_${p.slug.replace(/-/g, '_')}');
`;

    return {
      [`${p.slug}-block/block.json`]: blockJson,
      [`${p.slug}-block/index.php`]: blockPhp,
      [`${p.slug}-block/src/index.js`]: `import { registerBlockType } from '@wordpress/blocks';\n\nregisterBlockType('forge/${p.slug}', {\n  edit: () => <div className="forge-block-editor">Edit ${p.name}</div>,\n  save: () => <div className="forge-block-frontend">Frontend ${p.name}</div>\n});`,
    };
  }

  /**
   * 3. Custom WP REST API Endpoint Scaffold
   */
  public static restController(p: ScaffoldParams): Record<string, string> {
    const controllerPhp = `<?php
if (!defined('ABSPATH')) exit;

class ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_REST_Controller extends WP_REST_Controller {
    protected $namespace = 'forge/v1';
    protected $rest_base = '${p.slug}';

    public function register_routes() {
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [$this, 'get_items'],
                'permission_callback' => [$this, 'get_items_permissions_check'],
            ],
            [
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => [$this, 'create_item'],
                'permission_callback' => [$this, 'create_item_permissions_check'],
            ],
        ]);
    }

    public function get_items_permissions_check($request) {
        return current_user_can('read');
    }

    public function get_items($request) {
        return new WP_REST_Response(['status' => 'success', 'data' => ['message' => 'REST API Active']], 200);
    }

    public function create_item_permissions_check($request) {
        return current_user_can('edit_posts');
    }

    public function create_item($request) {
        $params = $request->get_json_params();
        return new WP_REST_Response(['status' => 'created', 'received' => $params], 201);
    }
}

add_action('rest_api_init', function() {
    $controller = new ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_REST_Controller();
    $controller->register_routes();
});
`;
    return {
      [`${p.slug}-api/class-rest-controller.php`]: controllerPhp,
    };
  }

  /**
   * 4. Admin Settings Page (Settings API)
   */
  public static adminSettingsPage(p: ScaffoldParams): Record<string, string> {
    const settingsPhp = `<?php
if (!defined('ABSPATH')) exit;

class ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_Settings_Page {
    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu_page']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function add_menu_page() {
        add_menu_page(
            '${p.name}',
            '${p.name}',
            'manage_options',
            '${p.slug}-settings',
            [$this, 'render_page'],
            'dashicons-admin-generic'
        );
    }

    public function register_settings() {
        register_setting('${p.slug}_group', '${p.slug}_option_api_key', ['sanitize_callback' => 'sanitize_text_field']);
        add_settings_section('${p.slug}_main', 'General Settings', null, '${p.slug}-settings');
        add_settings_field('${p.slug}_api_key', 'API Key', [$this, 'field_api_key_render'], '${p.slug}-settings', '${p.slug}_main');
    }

    public function field_api_key_render() {
        $val = get_option('${p.slug}_option_api_key', '');
        echo "<input type='text' name='${p.slug}_option_api_key' value='" . esc_attr($val) . "' class='regular-text' />";
    }

    public function render_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('${p.slug}_group');
                do_settings_sections('${p.slug}-settings');
                submit_button('Save Config');
                ?>
            </form>
        </div>
        <?php
    }
}
new ${p.slug.replace(/[^a-zA-Z0-0]/g, '_').toUpperCase()}_Settings_Page();
`;
    return {
      [`${p.slug}-settings/class-admin-settings.php`]: settingsPhp,
    };
  }

  /**
   * 5. WooCommerce Extension Scaffold
   */
  public static wooCommerceExtension(p: ScaffoldParams): Record<string, string> {
    const wooPhp = `<?php
/**
 * WooCommerce Extension Scaffold
 */
if (!defined('ABSPATH')) exit;

add_action('plugins_loaded', function() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p><strong>${p.name}</strong> requires WooCommerce to be active.</p></div>';
        });
        return;
    }

    // Add custom checkout field
    add_action('woocommerce_before_order_notes', function($checkout) {
        echo '<div id="forge_custom_checkout_field"><h3>' . __('Custom Note') . '</h3>';
        woocommerce_form_field('forge_order_note', [
            'type'        => 'textarea',
            'class'       => ['my-field-class form-row-wide'],
            'label'       => __('Special Instructions'),
            'placeholder' => __('Enter order instructions...'),
        ], $checkout->get_value('forge_order_note'));
        echo '</div>';
    });
});
`;
    return {
      [`${p.slug}-woo/class-wc-extension.php`]: wooPhp,
    };
  }

  /**
   * 6. Theme Scaffold (FSE / Block Theme)
   */
  public static themeScaffold(p: ScaffoldParams): Record<string, string> {
    const styleCss = `/*
Theme Name: ${p.name}
Theme URI: https://forge-ai.local/themes/${p.slug}
Author: ${p.author}
Description: ${p.description}
Version: 1.0.0
Requires at least: 6.4
Tested up to: 6.7
Requires PHP: 8.1
License: GNU General Public License v2 or later
Text Domain: ${p.slug}
*/
`;

    const themeJson = JSON.stringify({
      "$schema": "https://schemas.wp.org/trunk/theme.json",
      "version": 2,
      "settings": {
        "color": {
          "palette": [
            { "slug": "primary", "color": "#f97316", "name": "Orange Primary" },
            { "slug": "dark", "color": "#0f172a", "name": "Slate Dark" }
          ]
        },
        "typography": {
          "fontSizes": [
            { "slug": "small", "size": "13px", "name": "Small" },
            { "slug": "medium", "size": "16px", "name": "Medium" },
            { "slug": "large", "size": "24px", "name": "Large" }
          ]
        }
      }
    }, null, 2);

    const functionsPhp = `<?php
if (!defined('ABSPATH')) exit;

function ${p.slug.replace(/-/g, '_')}_setup() {
    add_theme_support('wp-block-styles');
    add_theme_support('align-wide');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
}
add_action('after_setup_theme', '${p.slug.replace(/-/g, '_')}_setup');
`;

    return {
      [`${p.slug}-theme/style.css`]: styleCss,
      [`${p.slug}-theme/theme.json`]: themeJson,
      [`${p.slug}-theme/functions.php`]: functionsPhp,
      [`${p.slug}-theme/templates/index.html`]: `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group"><h1>${p.name}</h1><p>${p.description}</p></div>\n<!-- /wp:group -->`,
    };
  }
}
