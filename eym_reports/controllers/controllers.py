# -*- coding: utf-8 -*-
# from odoo import http


# class /equiman/custom/addons/eymReports(http.Controller):
#     @http.route('//equiman/custom/addons/eym_reports//equiman/custom/addons/eym_reports/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('//equiman/custom/addons/eym_reports//equiman/custom/addons/eym_reports/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('/equiman/custom/addons/eym_reports.listing', {
#             'root': '//equiman/custom/addons/eym_reports//equiman/custom/addons/eym_reports',
#             'objects': http.request.env['/equiman/custom/addons/eym_reports./equiman/custom/addons/eym_reports'].search([]),
#         })

#     @http.route('//equiman/custom/addons/eym_reports//equiman/custom/addons/eym_reports/objects/<model("/equiman/custom/addons/eym_reports./equiman/custom/addons/eym_reports"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('/equiman/custom/addons/eym_reports.object', {
#             'object': obj
#         })
