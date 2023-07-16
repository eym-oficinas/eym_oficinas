# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError

import logging
_logger = logging.getLogger(__name__)

class reservation(models.Model):
    _inherit = 'hotel.folio'
    
    cleaning_services_ids = fields.Many2many('hotel.services.cleaning', string='Cleaning Services')
    feeding_services_ids = fields.Many2many('hotel.services.feeding', string='Feeding Services')
    veterinary_services_ids = fields.Many2many('hotel.services.veterinary', string='Veterinary Services')
    def compute_mac_has_service(self):
        if self.name:
            sale_order_id = self.env['sale.order'].search([['origin', '=', self.name]], limit=1) 
            if sale_order_id:
                self.mac_has_service = True
        self.mac_has_service = False
    mac_has_service = fields.Boolean(string='Has Service', compute=compute_mac_has_service)
    
    def action_create_quotations(self):
        values = {
                    "partner_id":  self.partner_id.id,
                    "client_order_ref": self.name,
                    "partner_invoice_id": self.partner_id.id,
                    "partner_shipping_id": self.partner_id.id,
                    "pricelist_id": self.partner_id.property_product_pricelist.id,
                 }

        if self.crm_lead_id:
            values['origin'] = self.crm_lead_id.name
            values['opportunity_id'] = self.crm_lead_id.id
        
        else:
            values['origin'] = self.name

        sale_order_id = self.env['sale.order'].create(values)
        
        if self.cleaning_services_ids:
            for service in self.cleaning_services_ids:
                values = {
                            'name':service.name,
                            'product_id':service.product_id.product_tmpl_id.id,
                            'product_uom_qty':int(1),
                            'price_unit':service.product_id.product_tmpl_id.list_price,
                            'order_id':sale_order_id.id
                         }
                if service.product_id.product_tmpl_id.taxes_id:
                    values['tax_id'] = [[6,0,service.product_id.product_tmpl_id.taxes_id.ids]]

                sale_order_line_id = self.env['sale.order.line'].create(values)
        
        if self.feeding_services_ids:
            for service in self.feeding_services_ids:
                values = {
                            'name':service.name,
                            'product_id':service.product_id.product_tmpl_id.id,
                            'product_uom_qty':int(1),
                            'price_unit':service.product_id.product_tmpl_id.list_price,
                            'order_id':sale_order_id.id
                        }
                if service.product_id.product_tmpl_id.taxes_id:
                    values['tax_id'] = [[6,0,service.product_id.product_tmpl_id.taxes_id.ids]]

                sale_order_line_id = self.env['sale.order.line'].create(values)
        
        if self.veterinary_services_ids:
            for service in self.veterinary_services_ids:
                values = {
                            'name':service.name,
                            'product_id':service.product_id.product_tmpl_id.id,
                            'product_uom_qty':int(1),
                            'price_unit':service.product_id.product_tmpl_id.list_price,
                            'order_id':sale_order_id.id
                        }
                if service.product_id.product_tmpl_id.taxes_id:
                    values['tax_id'] = [[6,0,service.product_id.product_tmpl_id.taxes_id.ids]]

                sale_order_line_id = self.env['sale.order.line'].create(values)

        return self.action_view_sale_orders_services()
    
    def action_view_sale_orders_services(self):
        if self.name:
            sale_order_id = self.env['sale.order'].search([['origin', '=', self.name]], limit=1)        
            return {
                        "name": _("Sale Orders for " + str(self.name) ),
                        "type": "ir.actions.act_window",
                        "res_model": "sale.order",
                        "view_mode": "form",
                        "res_id": sale_order_id.id
                    }
        return None