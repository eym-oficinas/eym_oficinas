# -*- coding: utf-8 -*-
{
    'name': "backup_automatized",
    'summary': """ Backup addons folder and database """,
    'description': """  """,
    
    'author': "Equipos y Mantenimientos, Daniel Jove",
    'website': "eym-oficinas.ovh",
    'category': 'Uncategorized',
    'version': '16.0.20230716',
    'depends': [
                    'base',
               ],
    'data': [
                'data/task_automatized.xml',
                'views/backups.xml',
                'security/ir.model.access.csv'
            ],
    'external_dependencies': {
                                "python": [
                                            #"paramiko",
                                          ]
                             },
}