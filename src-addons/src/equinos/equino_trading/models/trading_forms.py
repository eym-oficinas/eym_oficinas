# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request
from datetime import date
import urllib.parse


class trading_forms(models.Model):
    _name = 'trading.forms'
    _description = 'Trading Forms'
    
    name = fields.Char(string='Name')
    invite_url = fields.Char(string='Link')
    user_id = fields.Many2one('res.users', string='Usuario', default=lambda self: self.env.user)
    shipper_id = fields.Many2one('res.partner', string='Shipper') 
    from_departure_id = fields.Many2one('fly.codes', string='Departure')
    to_arrive_id = fields.Many2one('fly.codes', string='Arrive')   
    entry_date = fields.Date(string='Entry Date')
    entry_time = fields.Float(string='Entry Time')
    release_date = fields.Datetime(string='Relase Date & Time')     
    form_item_ids = fields.One2many('trading.forms.items', string='Animal', inverse_name="form_id") 
    crf_crm_lead_id = fields.Many2one('crm.lead', string='CRM Lead', inverse_name="form_id") 
    
    def save_shipping_form (self, values):
        
        shipping = {
                        'shipper_id': int(values['shipper']),
                        'from_departure_id': request.env['fly.codes'].sudo().browse(int(values['departure'])),
                        'to_arrive_id': request.env['fly.codes'].sudo().browse(int(values['arrive'])),
                        #'entry_date': request.env['trading.forms'].sudo().format_date(values['entry_date_time']),
                        #'release_date': request.env['trading.forms'].sudo().format_date(values['relase_date_time']),
                        #'entry_time': request.env['trading.forms'].sudo().format_date(values['entry_time']),                        
                   }
        
        shipping_id = request.env['trading.forms'].browse(int(values['id']))
        shipping_id.sudo().update(shipping)
        
        if shipping_id:
            form_id = request.env['trading.forms'].sudo().browse( int( shipping_id.id )) 
            for item in form_id.form_item_ids:
                item.unlink()
            form_id.sudo().update({'form_item_ids':None})    
                
        if values['items']:
            if len(values['items']) > 0:
                
                shipping_lines = {}
                
                for item in values['items']:
                    
                    if item['resgistered_name']:
                        shipping_lines['name'] = str( item['resgistered_name'] )
                        
                    if item['gender']:
                        shipping_lines['gender'] = int(item['gender'])
                        
                    if item['specie']:
                        shipping_lines['specie_id'] = int(item['specie'])
                        
                    if item['breed']:
                        shipping_lines['breed_id'] = int(item['breed'])
                        
                    if item['age']:
                        shipping_lines['age'] = str( item['age'] )
                        
                    if item['color']:
                        shipping_lines['color_id'] = int(item['color'])
                    
                    if item['microchip_id']:
                        shipping_lines['id_number_microchip'] = str(item['microchip_id'])
                        
                    if item['final_customer']:
                        shipping_lines['final_customer'] = str( item['final_customer'] )
                    
                    if item['t_number']:
                        shipping_lines['t_number'] = str( item['t_number'] )
                    
                    if item['driver_contact']:
                        shipping_lines['driver_id'] = str( item['driver_contact'] )
                    
                    if shipping_id:
                        shipping_lines['form_id'] = int( shipping_id.id )                     
                        
                    shipping_line_id = request.env['trading.forms.items'].sudo().create(shipping_lines)
        
        return values
    
    def format_date (self, _date):
        try:
            _date = str(_date).split('/')
            _date = str(_date[2]) + str('-') + str(_date[0]) + str('-') + str(_date[1])
            return _date
        except:
            None
        return ''
    
    def share_shipping_form(self, form_id=None):
        if form_id:
            self = form_id
        url = self.share_link()
        self.invite_url = url
        mail_template = self.env.ref('equino_trading.email_invite_shipping_form')
        mail_record = mail_template.send_mail(self.id, force_send=True)
        return mail_record            
    
    # def sit_crm_share_shipping_form(self, form_id=None):
    #     if form_id:
    #         self = form_id
    #     url = self.share_link()
    #     self.invite_url = url
    #     mail_template = self.env.ref('equino_trading.sit_email_invite_shipping_form')
    #     mail_record = mail_template.send_mail(self.id, force_send=True)
    #     return mail_record        
    
    def share_link(self):
        if not self.shipper_id:
            return  {
                        'warning':
                        {
                            'title': "Share Shipping Form Link",
                            'message': 'Shipper is required'
                        }
                    } 

        url = self.env['ir.config_parameter'].get_param('web.base.url')
        url = str(url) + str('/forms/shipping/?session=') + str(self.id) + str('&shipper=') + str(self.shipper_id.id)
        return url