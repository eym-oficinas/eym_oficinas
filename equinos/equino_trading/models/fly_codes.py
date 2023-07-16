# -*- coding: utf-8 -*-

from odoo import models, fields, api
class fly_codes(models.Model):
    _name = 'fly.codes'
    _description = 'Fly Codes'
    
    def compute_name(self):
        for record in self:
            record.name = str(record.code) + str(' ') + str(record.name)
            return record.name
            
    name = fields.Char(string='Name', comute='compute_name')
    code = fields.Char(string='Code', default='')