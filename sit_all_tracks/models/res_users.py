# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging
_logger = logging.getLogger(__name__)
from odoo.exceptions import UserError
import logging
_logger = logging.getLogger(__name__)


class sit_users_role(models.Model):
    _inherit = 'res.users'
    
    responsability = fields.Selection(string='Responsability', selection=[['OPERATIONS','OPERATIONS'],['ADMINISTRATION','ADMINISTRATION'],['CEO','CEO']])
