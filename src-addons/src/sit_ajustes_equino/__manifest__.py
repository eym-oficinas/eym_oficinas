# -*- coding: utf-8 -*-
{
    'name': "sit_ajustes_equino",

    'summary': """
        Ajustes de equinos""",

    'description': """
        Ajustes del módulo de equinos:
        - Disminuir el tamaño de las letras en el reporte de facturas
        - Opcion para eliminar los folders Addlines que vienen de otros proyectos
        - Añadir un campo de texto para vincularlo con Dropbox
        - Añadir la posibilidad de eliminar en la parte de all tracks
    """,

    'author': "Service-IT AR",
    'website': "https://service-it.com.ar",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '16.0.0.1.0-20260626',
    'license': 'OPL-1',

    # any module necessary for this one to work correctly
    'depends': ['base','crm','equino_trading'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
