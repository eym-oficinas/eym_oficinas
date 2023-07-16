# -*- coding: utf-8 -*-
{
    'name': "equino_trading",
    'summary': """ """,
    'description': """ """,
    'author': "",
    'website': "",
    'category': '',
    'version': '16.0',
    'depends': [
                    'base', 
                    'web', 
                    'account',
                    'product',
                    'website',
                    'website_sale',
                    'sale_management',
                    'crm',
                    'project',
               ],
    'data': [
                'security/ir.model.access.csv',
                
                'views/certificates_regulates.xml',
                'views/folders.xml',
                'views/company_barn.xml',
                'views/company_barn_space.xml',
                'views/equine_trading.xml',
                'views/product_template.xml',
                'views/sale_order.xml',
                'views/crm_leads.xml',
                'views/account_journal.xml',
                'views/account_move.xml',
                'views/fly_codes.xml',
                'views/trading_colors.xml',
                'views/trading_breeds.xml',
                'views/trading_genders.xml',
                'views/trading_species.xml',
                'views/trading_microchips.xml',
                'views/trading_forms.xml',
                'views/trading_forms_items.xml',
                'views/projects.xml',
                'views/project_task.xml',
                'views/project_track.xml',
                'views/project_tracks_all.xml',
                'views/project_types.xml',
                'views/trading_airlines.xml',
                'views/trading_receips.xml',
                
                'views/mail/shipping_form.xml',  
                'views/mail/crm_folder_documents.xml',   
                'views/mail/sale_folder_documents.xml', 
                
                # 'views/wizard/dialog_confirm.xml', 
                
                'reports/account_move.xml',                                           
                
                'views/pages/shipping_form.xml',
                
                'data/trading_species.xml',
                'data/trading_colors.xml',
                'data/trading_breeds.xml',
                'data/trading_genders.xml',
                'data/flys_codes.xml',
                'data/project_tracker.xml',
                'data/crm_stages.xml',
                'data/trading_airlines.xml',
                
                'views/menus.xml',
            ],
    'assets':   {
                    'web.assets_frontend':[
                                            '/equino_trading/static/src/js/frontend.js',
                                            '/equino_trading/static/src/css/frontend.css',
                                          ],
                    'web.assets_backend':[
                                            '/equino_trading/static/src/js/backend.js',
                                            '/equino_trading/static/src/css/backend.css',
                                          ]
                }
}