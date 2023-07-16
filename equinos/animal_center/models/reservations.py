# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError

import logging
_logger = logging.getLogger(__name__)

class reservation(models.Model):
    _inherit = 'hotel.folio'
    
    sale_order_ids = fields.Many2one('sale.order', string='Sale Order', inverse_name="reservation_id")    
    crm_lead_id = fields.Many2one('crm.lead', string='CRM Lead', related="sale_order_ids.opportunity_id", readonly=False)
    calendar_event_id = fields.One2many('calendar.event', string='', inverse_name="folio_id")
    project_id = fields.Many2one('project.project', related="sale_order_ids.project_id", string='Project Tracking')
    
    def compute_unit_id(self):
        for record in self:
            distinc_unit_ids = self.env['sale.order'].get_units(record.room_line_ids)             
            record.units_ids = self.env['hotel.room.type'].search([['id','in',distinc_unit_ids]])

    units_ids = fields.Many2many('hotel.room.type', string='Units', compute=compute_unit_id)

    datetime_checkin = fields.Datetime(string='Checkin', related="sale_order_ids.datetime_checkin", readonly=False)
    datetime_checkout = fields.Datetime(string='Checkout', related="sale_order_ids.datetime_checkout", readonly=False)
    
    is_equine = fields.Boolean(string='Equine Trading', related="sale_order_ids.is_equine", readonly=True)    
    container_ids = fields.One2many('trading.containers', string='Container', inverse_name="folio_id")
    
    # for containers
    sequence_departure = fields.Many2one('fly.codes', string='Departure', related='sale_order_ids.sequence_departure', readonly=True)
    sequence_arrive = fields.Many2one('fly.codes', string='Arrive', related='sale_order_ids.sequence_arrive', readonly=True)
    
    def unlink(self):
        response = super(reservation, self).unlink()
        for record in self:
            record.calendar_event_id.unlink()
        return response
    
    @api.model
    def create(self, values):
        _reservation = super (reservation, self).create(values)
        return _reservation
    
    @api.onchange('datetime_checkin')
    def _onchange_datetime_checkin(self):
        arguments = {
                        'reservation':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkin', arguments)
        
    @api.onchange('datetime_checkout')
    def _onchange_datetime_checkout(self):
        arguments = {
                        'reservation':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkout', arguments)
    
    @api.onchange('sequence_date')
    def _onchange_sequence_datey(self):
        arguments = {
                        'reservation':self
                    }
        self.env['change.fields'].handle_global_fields('sequence_date', arguments)    
    
    def is_occupied(self, product_id, start, end):
        __now = fields.Datetime.now()
        reservations_ids = self.env['hotel.folio'].search([['checkin_date','>=',start], ['checkout_date','<=',end]])  
        lines_ids = reservations_ids.room_line_ids.ids
        if reservations_ids:
            if  reservations_ids.room_line_ids:
                occupied_ids = self.env['hotel.folio.line'].search([['product_id','=',product_id.id],['id','in',lines_ids]]) 
                if occupied_ids:
                    return True                
        return False
    
    def unit_occupieds(self,start, end, current_reservation=None):
        __now = fields.Datetime.now()
        filter = ['|',['checkin_date','>=',start], ['checkout_date','<=',end]]
        if current_reservation:
            filter.append(['id','!=',current_reservation.id])
        reservations_ids = self.env['hotel.folio'].search(filter)  
        
        ids = []
        if reservations_ids:
            for reservation_id in reservations_ids:
                if reservation_id.units_ids:
                    for unit_id in reservation_id.units_ids:
                        ids.append(unit_id.id)
        return ids