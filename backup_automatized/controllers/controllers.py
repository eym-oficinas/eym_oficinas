# -*- coding: utf-8 -*-
# from odoo import http


# class BackupAutomatized(http.Controller):
#     @http.route('/backup_automatized/backup_automatized/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/backup_automatized/backup_automatized/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('backup_automatized.listing', {
#             'root': '/backup_automatized/backup_automatized',
#             'objects': http.request.env['backup_automatized.backup_automatized'].search([]),
#         })

#     @http.route('/backup_automatized/backup_automatized/objects/<model("backup_automatized.backup_automatized"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('backup_automatized.object', {
#             'object': obj
#         })
