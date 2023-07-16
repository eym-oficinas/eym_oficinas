# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging
_logger = logging.getLogger(__name__)

class services_veterinary(models.Model):
    _name = 'hotel.services.veterinary'
    _description = 'Services Veterinary'
    
    reservation_id = fields.Many2one('hotel.folio', string='Reservation', inverse_name='veterinary_services_ids')
    product_id = fields.Many2one(
                                    "product.product",
                                    "Service_id",
                                    required=True,
                                    ondelete="cascade",
                                    delegate=True,
                                )
    service_categ_id = fields.Many2one(
                                        "hotel.service.type",
                                        "Service Category",
                                        required=True,
                                        ondelete="restrict",
                                      )
    product_manager = fields.Many2one("res.users")