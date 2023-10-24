# -*- coding: utf-8 -*-
{
    'name': "Ajustes All Tracking (LiveCargo)",

    'summary': """
    Actualiza la informaciópn de all tracking    
    """,

    'description': """
        Actualiza la informaciópn de all tracking
        - Modificar tipo de formato, donde corresponda
        - filtrar la visualización de servicio
        - Distinguir responsables basado en colores.
    """,

    'author': "Service-IT AR",
    'website': "https://service-it.com.ar",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '16.0.0.1.0-20260626',
    'license': 'Other proprietary',

    # any module necessary for this one to work correctly
    'depends': ['base','equino_trading'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/project_tracker_grid_owner.xml',
        'views/project_tracker_grid.xml',
        'views/templates.xml',
        'views/res_users.xml',
        'data/sit_all_tracks.sit_all_tracks.csv'
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
