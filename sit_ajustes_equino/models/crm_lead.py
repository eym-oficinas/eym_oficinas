from odoo import api, fields, models, tools, _
import logging
from odoo.exceptions import ValidationError
from datetime import datetime

_logger = logging.getLogger(__name__)



class ProductTemplate(models.Model):
    _inherit = 'crm.lead'


    sit_shipping_list_url = fields.Char('Gdrive url')


    def action_share_shipping_form(self):
        # response = self.form_id.share_shipping_form(self.form_id)
        _logger.info("SIT form_id = %s, %s ", self.form_id, self.sit_shipping_list_url)
        response = self.form_id.sit_crm_share_shipping_form(self.form_id, self.sit_shipping_list_url)
        # response = self.form_id.share_shipping_form(self.form_id)


        if response:
            _type = 'success'
            _message = 'Shipping form was sent'
        else:
            _type = 'warning'
            _message = 'Shipping form was not sent'
            
        message = {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': ('Shipping Form'),
                'message': _message,
                'type':_type,
                'sticky': False,
            },
        }
        return message
    


    def sit_action_share_shipping_form(self):
        _logger.info("SIT form_id = %s, %s ", self.form_id, self.sit_shipping_list_url)        
        # response = self.form_id.share_shipping_form(self.form_id, self.sit_shipping_list_url)
        response = self.form_id.sit_share_shipping_form(self.form_id, self.sit_shipping_list_url)

        if response:
            _type = 'success'
            _message = 'Shipping form was sent'
        else:
            _type = 'warning'
            _message = 'Shipping form was not sent'
            
        message = {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': ('Shipping Form'),
                'message': _message,
                'type':_type,
                'sticky': False,
            },
        }
        return message