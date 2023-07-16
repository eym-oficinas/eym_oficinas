# -*- coding: utf-8 -*-
# from odoo import http


# class SitAjustesEquino(http.Controller):
#     @http.route('/sit_ajustes_equino/sit_ajustes_equino', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/sit_ajustes_equino/sit_ajustes_equino/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('sit_ajustes_equino.listing', {
#             'root': '/sit_ajustes_equino/sit_ajustes_equino',
#             'objects': http.request.env['sit_ajustes_equino.sit_ajustes_equino'].search([]),
#         })

#     @http.route('/sit_ajustes_equino/sit_ajustes_equino/objects/<model("sit_ajustes_equino.sit_ajustes_equino"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('sit_ajustes_equino.object', {
#             'object': obj
#         })
