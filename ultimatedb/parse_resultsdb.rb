# encoding: UTF-8

require 'rubygems'
require 'data_mapper'
require 'sqlite3'
require 'dm-sqlite-adapter'

DataMapper.setup(:default, 'sqlite:./ultimate.db')

class Monuments
  include DataMapper::Resource
  storage_names[:default] = 'monuments'
  
  property :id, Integer, :key => true
  property :nid_id, Integer
  property :parent_id, Integer
  property :child_order, Integer
  property :identification, Text
  property :categories, Text
  property :existance, Text
  property :state, Text
  property :register_numer, Text
  property :dating_of_obj, Text
  property :street, Text
  property :place_id, Text
  property :commune_id, Text
  property :district_id, Text
  property :voivodeship_id, Text
  property :latitude, Float
  property :longitude, Float
  property :coordinates_approval, Boolean
end

DataMapper.setup(:results, 'sqlite:../dbs/results.db')

class ResultMonuments
  include DataMapper::Resource 
  def self.default_repository_name
    :results
  end
  storage_names[:results] = 'monuments'

  property :oz_id, Integer, :min => 0   
  property :nid_id, Integer, :key => true
  property :touched, Integer
  property :name, Text
  property :address, Text
  property :date, Text
  property :categories, Text
  property :lat, Float
  property :lon, Float
end

DataMapper.finalize
DataMapper.auto_upgrade!

ResultMonuments.each do |monument|
  @m = Monuments.first(:id => monument.oz_id)
  @m.update(:state => "checked", 
            :identification => monument.name, 
            :street => monument.address, 
            :dating_of_obj => monument.date, 
            :categories => monument.categories, 
            :latitude => monument.latitude, 
            :longitude => monument.longitude)
end