# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError
from datetime import datetime, timedelta

class rooms(models.Model):
    _inherit = 'hotel.room'
    
    sale_id = fields.Many2one('sale.order', string='Sale Order', inverse_name="rooms_ids")
    product_id = fields.Many2one('product.product', string='Product', inverse_name="room_id")
    unit_category_id = fields.Many2one('unit.categories', string='Unit Category', related='room_categ_id.unit_category_id', store=True)
    
    def status_from_reservations(self):
        
        for record in self:
            record.status = 'available'
            
            __now = fields.Datetime.now() + timedelta(days=9)
    
            reserve_filter = [
                                ['state','=','sale'],
                                ['datetime_checkin','<=',__now],
                                ['datetime_checkout','>=',__now],
                             ]
            
            reservations = self.env['hotel.folio'].search(reserve_filter)
            
            for reservation in reservations: 
                for item in reservation.room_line_ids:                                        
                    if bool(__now >= item.checkin_date):
                        if bool(__now <= item.checkout_date):
                            if item.product_id.id == record.product_id.id :
                                record.status = 'occupied'
        
    status = fields.Selection(
                                [("available", "Available"), ("occupied", "Occupied")],
                                default="available",
                                compute=status_from_reservations
                             )
    
    
    def is_occupied(self, reservation, product_id):
        __now = fields.Datetime.now() # + timedelta(days=9) 
        for item in reservation.room_line_ids:                                        
            if bool(__now >= item.checkin_date):
                if bool(__now <= item.checkout_date):
                    if item.product_id.id == product_id.id:
                        return True
        return False