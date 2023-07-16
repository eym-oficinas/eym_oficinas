# See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models, _
from odoo.exceptions import UserError

class hotel_folio_line(models.Model):

    _inherit = "hotel.folio.line"
    
    def compute_unit_id(self):
        for record in self:
            record.unit_id = None
            if record.product_id:
                if not record.product_id.room_id:
                    room_id = self.env['hotel.room'].search([['product_id','=',record.product_id.id]])                    
                    room_id.product_id.update({'room_id':room_id.id})
                if record.product_id.room_id.unit_id:
                    record.unit_id = record.product_id.room_id.unit_id.id
        
    unit_id = fields.Many2one('hotel.room.type', string='Unit', compute=compute_unit_id, store=False)
    room_ids = fields.Many2one('calendar.event', string='', inverse_name='room_line_ids')