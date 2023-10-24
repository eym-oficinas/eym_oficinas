# -*- coding: utf-8 -*-
# from odoo import http


# class SitAllTracks(http.Controller):
#     @http.route('/sit_all_tracks/sit_all_tracks', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/sit_all_tracks/sit_all_tracks/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('sit_all_tracks.listing', {
#             'root': '/sit_all_tracks/sit_all_tracks',
#             'objects': http.request.env['sit_all_tracks.sit_all_tracks'].search([]),
#         })

#     @http.route('/sit_all_tracks/sit_all_tracks/objects/<model("sit_all_tracks.sit_all_tracks"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('sit_all_tracks.object', {
#             'object': obj
#         })
