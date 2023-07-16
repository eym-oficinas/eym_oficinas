# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.http import request

import requests

class dialog_confirm(models.TransientModel):
    _name = 'dialog.confirm'
    _description = 'Confirm Dialog'
    
    def compute_text(self):
        for dialog in self:
            dialog.text = request.session.text
    
    text = fields.Char(string='Text', compute=compute_text)
    
    def compute_action(self):
        for dialog in self:
            dialog.action = request.session.action
        
    action = fields.Char(string='Action', compute=compute_action)
    
    def action_confirm_dialog(self):
        if self.action:
            if self.action == 'update_service_type':
                self.update_service_type()
            
            if self.action == 'update_sequence_date':
                self.update_sequence_date()
                
            if self.action == 'update_qty':
                self.update_qty()
                
            if self.action == 'update_date_arrive':
                self.update_date_arrive()
                
            if self.action == 'update_sequence_specie':
                self.update_sequence_specie()
                
            if self.action == 'update_sequence_departure':
                self.update_sequence_departure()
                
            if self.action == 'update_sequence_arrive':
                self.update_sequence_arrive()
                
            if self.action == 'update_trading_airline':
                self.update_trading_airline()
    
    def update_service_type(self):
        None

    def update_qty(self):
        None
        
    def update_date_arrive(self):
        None
    
    def update_sequence_departure(self):
        None
    
    def update_sequence_arrive(self):
        None
    
    def update_sequence_date(self):
        None
        
    def update_trading_airline(self):
        None
    
    def update_sequence_specie(self):
        None