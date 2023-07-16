# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request
from odoo.exceptions import UserError
from datetime import timedelta
from odoo.tools.misc import DEFAULT_SERVER_DATE_FORMAT
from datetime import datetime

import requests

class change_fields(models.Model):
    _name = 'change.fields'
    _description = 'Change Fields'
    
    def handle_global_fields(self, action, arguments):
        if action:
            if action == 'update_name':
                self.update_name(arguments)
                
            if action == 'update_service_type':
                self.update_service_type(arguments)
            
            if action == 'update_sequence_date':
                self.update_sequence_date(arguments)
                
            if action == 'update_qty':
                self.update_qty(arguments)
                
            if action == 'update_sequence_specie':
                self.update_sequence_specie(arguments)
                
            if action == 'update_sequence_departure':
                self.update_sequence_departure(arguments)
                
            if action == 'update_sequence_arrive':
                self.update_sequence_arrive(arguments)
                
            if action == 'update_trading_airline':
                self.update_trading_airline(arguments)
                
            if action == 'update_datetime_checkin':
                self.update_datetime_checkin(arguments)
            
            if action == 'update_datetime_checkout':
                self.update_datetime_checkout(arguments)
    
    def update_service_type(self,arguments):
        object = None
        if 'crm' in arguments:
            object = arguments['crm']

        # should exist some setup for remove project
        if object.project_id:
            if object.project_id.is_trading_template == False:
                object.project_id.unlink()
                project_id_tpl = self.env['project.project'].search([
                                                                        ['is_trading_template','=',True],
                                                                        ['service_type','=',object.service_type]
                                                                    ], limit=1)
                object.project_id =  project_id_tpl

                object.project_id.replicate_project_tracking(object)
            else:
                project_id_tpl = self.env['project.project'].search([
                                                                        ['is_trading_template','=',True],
                                                                        ['service_type','=',object.service_type]
                                                                    ], limit=1)
                object.project_id =  project_id_tpl
        
    def update_datetime_checkin(self,arguments):
        object = None
        reservation_id = None
        if 'sale_order' in arguments:
            object = arguments['sale_order'] 
            reservation_id =  object.reservation_id
        if 'reservation' in arguments:
            reservation_id = arguments['reservation'] 
                        
        if reservation_id:
                reservation_id.update({'datetime_checkin':reservation_id.datetime_checkin})
                if reservation_id.room_line_ids:
                    for line in reservation_id.room_line_ids:
                        line.update({'checkin_date':reservation_id.datetime_checkin})  
                    reservation_id.calendar_event_id.update({'start':reservation_id.datetime_checkin})                     
                                                 
    
    def update_datetime_checkout(self,arguments):
        object = None
        reservation_id = None
        if 'sale_order' in arguments:
            object = arguments['sale_order']  
        if 'reservation' in arguments:
            reservation_id = arguments['reservation'] 
            
        if reservation_id:
            reservation_id.update({'datetime_checkout':reservation_id.datetime_checkout})
            if reservation_id.room_line_ids:
                for line in reservation_id.room_line_ids:
                    line.update({'checkout_date':reservation_id.datetime_checkout})  
                reservation_id.calendar_event_id.update({'stop':reservation_id.datetime_checkout})   
                              
            
    def update_qty(self,arguments):        
        object = None
        oportunity_id = None
        sale_orders = None

        if 'crm' in arguments:
            object = arguments['crm']            
            sale_orders = self.env['sale.order'].search([['opportunity_id','=',object.id]])
            oportunity_id = object
            
        if 'sale_order' in arguments:
            object = arguments['sale_order']  
            oportunity_id = object.opportunity_id   
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'calendar_event' in arguments:
            object = arguments['calendar_event'] 
            oportunity_id = object.crm_lead_id   
            if oportunity_id:       
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'reservation' in arguments:
            object = arguments['reservation'] 
            oportunity_id = object.crm_lead_id  
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
                
        if oportunity_id:
            if oportunity_id.project_id.is_trading_template == False:
                oportunity_id.project_id.update({'name':oportunity_id.name})
                oportunity_id.project_id.project_tracker_grid_ids.update({'name':oportunity_id.name})
        
        if sale_orders: 
            self.sync_reservation(sale_orders)
            self.sync_reservation_calendar(sale_orders)
        
    
    def update_sequence_departure(self,arguments):
        object = None
        oportunity_id = None
        sale_orders = None
        
        if 'crm' in arguments:
            object = arguments['crm']            
            sale_orders = self.env['sale.order'].search([['opportunity_id','=',object.id]])
            oportunity_id = object
            
        if 'sale_order' in arguments:
            object = arguments['sale_order']  
            oportunity_id = object.opportunity_id   
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'calendar_event' in arguments:
            object = arguments['calendar_event'] 
            oportunity_id = object.crm_lead_id   
            if oportunity_id:       
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'reservation' in arguments:
            object = arguments['reservation'] 
            oportunity_id = object.crm_lead_id  
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
            
            if oportunity_id.project_id.is_trading_template == False:
                oportunity_id.project_id.update({'name':oportunity_id.name})
                oportunity_id.project_id.project_tracker_grid_ids.update({'name':oportunity_id.name})
        
            self.sync_reservation(sale_orders)
            self.sync_reservation_calendar(sale_orders)
            
    
    def update_sequence_arrive(self,arguments):
        object = None
        oportunity_id = None
        sale_orders = None
        
        if 'crm' in arguments:
            object = arguments['crm']            
            sale_orders = self.env['sale.order'].search([['opportunity_id','=',object.id]])
            oportunity_id = object
            
        if 'sale_order' in arguments:
            object = arguments['sale_order']  
            oportunity_id = object.opportunity_id   
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'calendar_event' in arguments:
            object = arguments['calendar_event'] 
            oportunity_id = object.crm_lead_id   
            if oportunity_id:       
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'reservation' in arguments:
            object = arguments['reservation'] 
            oportunity_id = object.crm_lead_id  
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
            
            if oportunity_id.project_id.is_trading_template == False:
                oportunity_id.project_id.update({'name':oportunity_id.name})
                oportunity_id.project_id.project_tracker_grid_ids.update({'name':oportunity_id.name})
        
            self.sync_reservation(sale_orders)
            self.sync_reservation_calendar(sale_orders)
            
        
    def update_name(self, arguments):
        object = None
        if 'crm' in arguments:
            object = arguments['crm']            
            object_to = self.env['sale.order'].search([['opportunity_id','=',object.id]])
            if not object_to:
                object_to = object
                if object_to:
                    for my_object in object_to:
                        if my_object.project_id:
                            if my_object.project_id.is_trading_template == False:
                                my_object.project_id.update({'name':my_object.name})
                                my_object.project_id.project_tracker_grid_ids.update({'name':my_object.name})
        
    
    def update_sequence_date(self, arguments):
        object = None
        oportunity_id = None
        sale_orders = None
        
        if 'crm' in arguments:
            object = arguments['crm']            
            sale_orders = self.env['sale.order'].search([['opportunity_id','=',object.id]])
            oportunity_id = object
            
        if 'sale_order' in arguments:
            object = arguments['sale_order']  
            oportunity_id = object.opportunity_id   
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'calendar_event' in arguments:
            object = arguments['calendar_event'] 
            oportunity_id = object.crm_lead_id   
            if oportunity_id:       
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
        
        if 'reservation' in arguments:
            object = arguments['reservation'] 
            oportunity_id = object.crm_lead_id  
            if oportunity_id:        
                sale_orders = self.env['sale.order'].search([['opportunity_id','=',oportunity_id.id]])
    
        if sale_orders:
            for my_object in sale_orders:
                if my_object.project_id:
                    if my_object.project_id.is_trading_template == False:
                        my_object.project_id.update({'name':my_object.name})    
                        tracks = self.env['project.tracker.grid'].search([['project_id','=',my_object.project_id.id]])  
                        if tracks:
                            for track in tracks:     
                                estimate_departmenture_arrival = my_object.sequence_date + timedelta(days=1) 
                                track.update({'estimate_departmenture_arrival':estimate_departmenture_arrival})      
                    
        
    def update_trading_airline(self,arguments):
        None
    
    def update_sequence_specie(self,arguments):
        None
    
    def sync_reservation_calendar(self, sale_orders):
        if sale_orders:
            for sale_order in sale_orders:
                if sale_order.reservation_id:                    
                    sale_order.reservation_id.calendar_event_id.unlink() 
                    events_ids = self.env['sale.order'].create_calendar_event(sale_order.reservation_id)
                    for event_id in events_ids:
                        event_id = self.env['calendar.event'].browse(int(event_id))
                        unit_name = str
                        for unit_id in event_id.units_ids:
                            unit_name = unit_id.name
                        count = event_id.line_get_count()
                        if sale_order.is_equine:
                            event_sequence =   str(unit_name) + str(' : ')
                            if sale_order.sequence_date:
                                date = datetime.strptime(str(sale_order.sequence_date), DEFAULT_SERVER_DATE_FORMAT)
                                sequence_date = str(date.month) + str('-') + str(date.day) + str('-') + str(date.year)
                                event_sequence += str(sequence_date) + str(' ')
                            if sale_order.sequence_qty:
                                event_sequence += str(count) + str(' ') + str(sale_order.sequence_specie.name) + str(' ')
                            if sale_order.sequence_departure:
                                event_sequence += str(sale_order.sequence_departure.code) + str('-')
                            if sale_order.sequence_arrive:
                                event_sequence += str(sale_order.sequence_arrive.code)
                            if sale_order.partner_id:
                                event_sequence += str(' ') + str(sale_order.partner_id.name)
                        event_id.write({
                                        'name':  event_sequence,
                                        })
                       
         
    
    def sync_reservation(self, sale_orders):
        if sale_orders:
                for sale_order in sale_orders:
                    if sale_order.reservation_id:
                        if sale_order.reservation_id.room_line_ids:
                            index = 1
                            for line in sale_order.reservation_id.room_line_ids:
                                if index > sale_order.sequence_qty:
                                    line.unlink()
                                index += 1
                            
                        count = len(sale_order.reservation_id.room_line_ids) 
                        
                        exclude_ids= []
                        unit_ids = self.env['hotel.folio'].unit_occupieds(sale_order.reservation_id.datetime_checkin, sale_order.reservation_id.datetime_checkout, sale_order.reservation_id) 
                        
                        for line in sale_order.reservation_id.room_line_ids:
                            exclude_ids.append(line.product_id.room_id.id)
                        
                        # raise UserError (str (count) +  str (' - ') +str (sale_order.sequence_qty) )
                        
                        if count < sale_order.sequence_qty:
                            left = (sale_order.sequence_qty - count)

                            
                            
                            rooms = self.env['hotel.room'].search([
                                                                        ['unit_category_id','in',sale_order.unit_category_id.ids], 
                                                                        ['id','not in',exclude_ids],
                                                                        ['room_categ_id','not in',unit_ids], 
                                                                ],
                                                                    limit=left
                                                                )
                            
                            self.create_room_left(rooms, sale_order)
                            
        

    def create_room_left(self, rooms, sale_order):
        if rooms and sale_order.generate_type == 'automatic':
            for room in rooms:
                is_occupied = self.env['hotel.room'].is_occupied(sale_order.reservation_id, room.product_id)
                if is_occupied:
                    None
                else:
                    room_line = {
                                    'checkin_date': sale_order.reservation_id.datetime_checkin,
                                    'checkout_date': sale_order.reservation_id.datetime_checkout,
                                    'product_id': room.product_id.id,
                                    'tax_id': room.taxes_id,
                                    'folio_id': sale_order.reservation_id.id                                    
                                }
                    
                    sale_order.reservation_id.room_line_ids.create(room_line)