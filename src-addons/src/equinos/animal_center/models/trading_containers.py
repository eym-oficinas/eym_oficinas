# See LICENSE file for full copyright and licensing details.

from odoo import _, api, fields, models
from odoo.exceptions import ValidationError
from odoo.osv import expression


class trading_containers(models.Model):

    _name = "trading.containers"
    _description = "Trading Containers"
    
    name = fields.Char(string='Identifier')
    folio_id = fields.Many2many('hotel.folio', string='Current Reservation', inverse_name="container_ids", readonly=True)
    state = fields.Selection(string='State', default='in_place', selection=[['in_place', 'In Place'], ['to_place', 'To Place'], ['to_other_location', 'To Other Location'], ['other_location', 'Other Location']])
    sequence_departure = fields.Many2one('fly.codes', string='Departure', related='folio_id.sequence_departure', readonly=True)
    sequence_arrive = fields.Many2one('fly.codes', string='Arrive', related='folio_id.sequence_arrive', readonly=True)
    datetime_checkin = fields.Datetime(string='Checkin', related="folio_id.datetime_checkin", readonly=True)
    datetime_checkout = fields.Datetime(string='Checkout', related="folio_id.datetime_checkout", readonly=True)