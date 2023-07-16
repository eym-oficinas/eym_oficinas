# -*- coding: utf-8 -*-
{
    'name': "sit- inventory",

    'summary': """
        SIT_FARMA Ajuste de productos
        """,

    'description': """
        SIT_FARMA Ajuste de productos
    """,

    'author': "Service-IT AR",
    'website': "https://service-it.com.ar",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list


    'category': 'Inventory',
    'version': '16.0.0.2.0',
    'license': 'OPL-1',
    # any module necessary for this one to work correctly
    'depends': ['base','stock', 'sale', 'purchase','point_of_sale','hr_expense','mail','contacts','calendar','survey','hr_attendance','pos_loyalty','pos_sale_loyalty','l10n_latam_base','stock_account','base_address_extended','account_debit_note','account_edi_ubl_cii','account_payment','account_sequence','analytic','barcodes_gs1_nomenclature','base_import','base_vat','digest','hr_org_chart','l10n_latam_account_sequence','l10n_pe','loyalty','payment','pos_cache','pos_sale_product_configurator','privacy_lookup','product_expiry','resource','sale_loyalty','sale_product_configurator','sale_purchase','sale_stock','sales_team','spreadsheet_account','spreadsheet_dashboard_account','spreadsheet_dashboard_hr_expense','spreadsheet_dashboard_purchase','spreadsheet_dashboard_sale','spreadsheet_dashboard_sale_expense','spreadsheet_dashboard_stock_account','uom','utm','web_editor','web_kanban_gauge','web_tour','gamification','board','http_routing'],

    # always loaded
    'data': [

        'security/ir.model.access.csv',
        'views/product_template_views.xml',
        'views/product_product_views.xml',
        'views/product_configuration_views.xml',
        'views/menu_views.xml',        
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'installable': True,
    'application': True,    
}
