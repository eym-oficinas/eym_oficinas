# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from werkzeug import urls
import math

import logging
_logger = logging.getLogger(__name__)

class shipping_form(http.Controller):

    @http.route('/form/shippers', methods=['POST'], type='json', auth="public", website=True)
    def get_shippers(self, **kw):
        return request.env['res.partner'].sudo().search_read([], ['id', 'name'])
    
    @http.route('/form/flyes', methods=['POST'], type='json', auth="public", website=True)
    def get_flyes(self, **kw):
        return request.env['fly.codes'].sudo().search_read([], ['id', 'name', 'code'])

    @http.route('/form/get_item_data', methods=['POST'], type='json', auth="public", website=True)
    def get_item_data(self, **kw):
        return request.env['trading.forms.items'].sudo().get_item_data()
    
    @http.route('/form/save', methods=['POST'], type='json', auth="public", website=True)
    def save(self, **kw):
        values = kw.get('values')
        _logger.warning('save values')
        _logger.warning(values)
        request.env['trading.forms'].sudo().save_shipping_form(values)
        return values
    
    @http.route('/form/fill_form', methods=['POST'], type='json', auth="public", website=True)
    def fill_form(self, **kw):
        form_id = kw.get('form_id')
        form_id = request.env['trading.forms'].sudo().browse(int(form_id))
        response = {
                        'shipper_id': form_id.shipper_id.id
                    }
        if form_id.from_departure_id:
            response['from_departure_id'] = form_id.from_departure_id.id
        if form_id.to_arrive_id:
            response['to_arrive_id'] = form_id.to_arrive_id.id
        if form_id.entry_date:
            response['entry_date'] = form_id.entry_date
        if form_id.entry_time:
            response['entry_time'] = str(self.float_time_convert(form_id.entry_time)).replace(',',':')
        if form_id.entry_time:
            response['release_date'] = form_id.release_date
        if form_id.crf_crm_lead_id:
            response['crf_crm_lead_id'] = form_id.crf_crm_lead_id.name
        if form_id.form_item_ids:
            items = []
            for item in form_id.form_item_ids:
                items.append(item.read())
            response['items'] = items
        return response
    
    def float_time_convert(self, float_val):    
        factor = float_val < 0 and -1 or 1    
        val = abs(float_val)    
        return (factor * int(math.floor(val)), int(round((val % 1) * 60)))