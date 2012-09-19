# encoding: UTF-8

require 'rubygems'
require 'data_mapper'
require 'sqlite3'
require 'dm-sqlite-adapter'
require 'csv'

DataMapper.setup(:default, 'sqlite:../dbs/cities.db')

class Cities
  include DataMapper::Resource
  storage_names[:default] = 'cities'
  
  property :city, Text
  property :nid_id, Integer, :key => true
end

DataMapper.finalize
DataMapper.auto_upgrade!

puts "Start parsing"

CSV.foreach('relics_history.csv') do |line|
  if Cities.first(:nid_id => line[3]) == nil
    Cities.create(:nid_id => line[3], :city => line[10])
  end
end