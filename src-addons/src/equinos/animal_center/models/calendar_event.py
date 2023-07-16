# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError

class calendar_event(models.Model):
    _inherit = 'calendar.event'
    _description = 'Calendar Event'
    
    is_equine = fields.Boolean(string='Trading', related="folio_id.is_equine")
    
    folio_id = fields.Many2one('hotel.folio', inverse_name="calendar_event_id", string='Reservation')
    sale_order_id = fields.Many2one('sale.order', string='Sale Order', related="folio_id.sale_order_ids")
    project_id = fields.Many2one('project.project', related="folio_id.project_id", string='Project Tracking')
    
    units_ids = fields.Many2many('hotel.room.type', string='Units', store=True)  
    
    def compute_room_line_ids(self):
        for record in self:
            
            record.room_line_ids = None
            # must be one for title and just one customer?
            unit = None
            for unit_id in record.units_ids:
                unit = unit_id.id

            ids  = []
            for line in record.room_line_ids_all:
                if unit == line.unit_id.id:
                    ids.append(line.id)
            
            record.room_line_ids = self.env['hotel.folio.line'].search([['unit_id','=',unit], ['id','in',ids]])

    room_line_ids = fields.Many2many("hotel.folio.line", string='Rooms', compute=compute_room_line_ids)    
    room_line_ids_all = fields.One2many("hotel.folio.line", string='Rooms', related="folio_id.room_line_ids")
    
    def compute_units_ids(self):
        for record in self:
            record.filter_units_ids = record.units_ids
                    
    filter_units_ids = fields.Many2one('hotel.room.type', string='Units', compute=compute_units_ids, store=True)
    
    def compute_color(self):

        # odoo colors: 11 purple , 5 dark purple
        # states color meaning [4=] [5=completed]
        
        for record in self: 
            record.color = int(11)
            
            
    color = fields.Integer(string="Color", compute=compute_color)
    
    @api.onchange('datetime_checkin')
    def _onchange_datetime_checkin(self):
        arguments = {
                        'calendar_event':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkin', arguments)
        
    @api.onchange('datetime_checkout')
    def _onchange_datetime_checkout(self):
        arguments = {
                        'calendar_event':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkout', arguments)
    
    @api.onchange('sequence_date')
    def _onchange_sequence_date(self):
        arguments = {
                        'sale_order':self
                    }
        self.env['change.fields'].handle_global_fields('sequence_date', arguments) 
    
    def line_get_count(self):
        for record in self:
            # must be one for title and just one customer?
            unit = None
            for unit_id in record.units_ids:
                unit = unit_id.id

            count  = 0
            for line in record.room_line_ids_all:
                if unit == line.unit_id.id:
                    count += 1
            return count