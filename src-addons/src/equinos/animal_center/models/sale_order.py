# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import timedelta
from odoo.exceptions import UserError
from odoo.tools.misc import DEFAULT_SERVER_DATE_FORMAT
from datetime import datetime

class sale_order(models.Model):
    _inherit = 'sale.order'
    
    generate_type = fields.Selection(string='Rooms in Units', selection=[['automatic','Automatic'],['manual','Manual']], default='automatic')
    unit_category_id = fields.Many2one('unit.categories', string='Unit Category', inverse_name="sale_order_ids") 
    unit_id = fields.Many2many('hotel.room.type', string='Unit', inverse_name="sale_order_ids")  
    reservation_id = fields.Many2one('hotel.folio', string='Reservation', inverse_name="sale_order_ids")
    room_line_ids = fields.One2many('folio.room.line', string='', related='reservation_id.room_line_ids')
    datetime_checkin = fields.Datetime(string='Checkin')
    datetime_checkout = fields.Datetime(string='Checkout')  
    
    @api.onchange('datetime_checkin')
    def _onchange_datetime_checkin(self):
        for sale_order in self:
            if sale_order.state not in ['done', 'cancel']: 
                if sale_order.datetime_checkin:
                    if sale_order.reservation_id:
                        if sale_order.reservation_id.room_line_ids:
                            for item in sale_order.reservation_id.room_line_ids:  
                                if sale_order.reservation_id.state not in ['done', 'cancel']: 
                                    is_occupied = self.env['hotel.room'].is_occupied(sale_order.reservation_id, item.product_id) 
                                    if is_occupied:  
                                        raise UserError('Reservation is in progress and confirmed rigth now.')
                                    else:
                                        sale_order.reservation_id.update({'datetime_checkin':self.datetime_checkin})
                                        item.update({'checkin_date':self.datetime_checkin})
                    
    @api.onchange('datetime_checkout')
    def _onchange_datetime_checkout(self):
        for sale_order in self:
            if sale_order.state not in ['done', 'cancel']: 
                if sale_order.datetime_checkout:
                    if sale_order.reservation_id:
                        if sale_order.reservation_id.room_line_ids:
                            for item in sale_order.reservation_id.room_line_ids:    
                                    if sale_order.reservation_id.state not in ['done', 'cancel']:
                                        is_occupied = self.env['hotel.room'].is_occupied(self.reservation_id, item.product_id)
                                        if is_occupied:
                                            raise UserError('Reservation is in progress and confirmed rigth now.')
                                        else:
                                            sale_order.reservation_id.update({'datetime_checkin':self.datetime_checkin})
                                            item.update({'datetime_checkout':self.datetime_checkout})


    def action_create_reserve(self):
        calendar_event_id = None
        rooms = None
        if self.generate_type == 'automatic':
            rooms = None
            unit_ids = self.env['hotel.folio'].unit_occupieds(self.datetime_checkin, self.datetime_checkout)     
            rooms = self.env['hotel.room'].search([
                                                    ['unit_category_id','in',self.unit_category_id.ids], 
                                                    ['room_categ_id','not in',unit_ids],  
                                                  ],
                                                    limit=self.sequence_qty
                                                  )

        oportunity_id = self.env['crm.lead'].search([['name', '=', self.origin]])
        
        values = {
                    'partner_id':self.partner_id.id, 
                    'partner_invoice_id':self.partner_invoice_id.id,
                    'partner_shipping_id': self.partner_shipping_id.id,
                    'sale_order_ids': self.id,         
                    'datetime_checkin': self.datetime_checkin,
                    'datetime_checkout': self.datetime_checkout,       
                 }
        if oportunity_id:
            values['crm_lead_id'] = oportunity_id.id
        
        reservation = self.env['hotel.folio'].create(values)
        self.reservation_id = reservation
        
        
        if rooms and self.generate_type == 'automatic':
        
            for room in rooms:
                is_occupied = self.env['hotel.folio'].is_occupied(room.product_id, self.datetime_checkin, self.datetime_checkout)
                #if is_occupied:
                #    None
                #else:
                room_line = {
                                'checkin_date': self.datetime_checkin,
                                'checkout_date': self.datetime_checkout,
                                'product_id': room.product_id.id,
                                'tax_id': room.taxes_id,
                                'folio_id': reservation.id,                               
                            }
                    
                reservation.room_line_ids.create(room_line)
            
            self.reservation_id = reservation
            
            ids = []
            ids = self.create_calendar_event(reservation)
            if len(ids) > 0:
                events = self.env['calendar.event'].search([['id','in',ids]])
                if events:
                    for event in events:                    
                        event.update({'folio_id': self.reservation_id.id})
        
        return calendar_event_id
        
        
    def create_calendar_event(self, _reservation):        
        calendar_events_id = []
        ids = []
        if _reservation.room_line_ids:
            for line in _reservation.room_line_ids:
                
                if line.product_id:
                    if line.product_id.room_id:                        
                        ids.append(line.product_id.room_id.id)
        
        distinc_unit_ids = self.get_units(_reservation.room_line_ids)
        
        units_ids = None 
        if len( distinc_unit_ids ) > 0:
            units_ids = self.env['hotel.room.type'].search( [['id', 'in', distinc_unit_ids]] )    
    
        if units_ids:   
            for units_id in units_ids:
                if units_id:                      
                    event = {
                                'name': str(units_id.name) + str(' : ') + str(_reservation.crm_lead_id.name),
                                'start': _reservation.datetime_checkin,
                                'stop': _reservation.datetime_checkout,                                
                            }

                    calendar_event = self.env['calendar.event'].create(event)
                    
                    calendar_event.write({
                                            'units_ids':  [(6, 0, [units_id.id])],
                                         })

                    calendar_events_id.append(calendar_event.id)

        if len (calendar_events_id) > 0:
            _reservation.write({'calendar_event_id':[[6,0,calendar_events_id]]})
            if self.sequence_qty:
                for event_id in _reservation.calendar_event_id:
                    unit_name = str
                    for unit_id in event_id.units_ids:
                        unit_name = unit_id.name
                    count = event_id.line_get_count()
                    if self.is_equine:
                        event_sequence =   str(unit_name) + str(' : ')
                        if self.sequence_date:
                            date = datetime.strptime(str(self.sequence_date), DEFAULT_SERVER_DATE_FORMAT)
                            sequence_date = str(date.month) + str('-') + str(date.day) + str('-') + str(date.year)
                            event_sequence += str(sequence_date) + str(' ')
                        if self.sequence_qty:
                            event_sequence += str(count) + str(' ') + str(self.sequence_specie.name) + str(' ')
                        if self.sequence_departure:
                            event_sequence += str(self.sequence_departure.code) + str('-')
                        if self.sequence_arrive:
                            event_sequence += str(self.sequence_arrive.code)
                        if self.partner_id:
                            event_sequence += str(' ') + str(self.partner_id.name)
                    event_id.write({
                                    'name':  event_sequence,
                                    })

        return calendar_events_id
    
    @api.onchange('datetime_checkin')
    def _onchange_datetime_checkin(self):
        arguments = {
                        'sale_order':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkin', arguments)
        
    @api.onchange('datetime_checkout')
    def _onchange_datetime_checkout(self):
        arguments = {
                        'sale_order':self
                    }
        self.env['change.fields'].handle_global_fields('update_datetime_checkout', arguments)
    
    @api.onchange('sequence_qty')
    def _onchange_sequence_qty(self):
        if self.sequence_qty:
            self.opportunity_id.sequence_qty = self.sequence_qty
        arguments = {
                        'sale_order':self
                    }
        self.env['change.fields'].handle_global_fields('update_qty', arguments)  
        
    @api.onchange('sequence_date')
    def _onchange_sequence_date(self):
        arguments = {
                        'sale_order':self
                    }
        self.env['change.fields'].handle_global_fields('sequence_date', arguments)  
    
    @api.onchange('is_equine', 'sequence_date', 'sequence_qty', 'sequence_specie', 'sequence_departure', 'sequence_arrive', 'partner_id')
    def _onchange_(self):
        if self:
            if self.is_equine:
                crm_sequence = str(' ')
                if self.sequence_date:
                    date = datetime.strptime(str(self.sequence_date), DEFAULT_SERVER_DATE_FORMAT)
                    sequence_date = str(date.month) + str('-') + str(date.day) + str('-') + str(date.year)
                    crm_sequence += str(sequence_date) + str(' ')
                if self.sequence_qty:
                    crm_sequence += str(self.sequence_qty) + str(' ') + str(self.sequence_specie.name) + str(' ')
                if self.sequence_departure:
                    crm_sequence += str(self.sequence_departure.code) + str('-')
                if self.sequence_arrive:
                    crm_sequence += str(self.sequence_arrive.code)
                if self.partner_id:
                    crm_sequence += str(' ') + str(self.partner_id.name)
                    
                if self.opportunity_id:
                    values = {'name':crm_sequence}
                    self.opportunity_id.update(values)
                    self.origin = crm_sequence
                    arguments = {
                        'sale_order':self
                    }
                    self.env['change.fields'].handle_global_fields('update_name', arguments) 

    def get_units(self, lines):
        unit_ids = []
        for line in lines:
            if self.exist_unit_id(unit_ids, line.unit_id.id) == False:
               unit_ids.append(line.unit_id.id)
        return unit_ids
    
    def exist_unit_id(self, unit_ids, id):
        for _id in unit_ids:
            if _id == id:
                return True
        return False
        