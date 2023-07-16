# -*- coding: utf-8 -*-

from odoo import models, fields, _
class product_template(models.Model):
    _inherit = 'project.task'
    _description = 'Project Task'   
    
    is_equine = fields.Boolean(string='Template', related='project_id.is_equine')
    is_trading_template = fields.Boolean(string='Template', related='project_id.is_trading_template')
    service_type = fields.Selection(string='Service Type', related='project_id.service_type')   