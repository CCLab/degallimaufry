# encoding: UTF-8

require 'rubygems'
require 'sinatra'
require 'data_mapper'
require 'sqlite3'
require 'dm-sqlite-adapter'

DataMapper::Logger.new($stdout, :debug)
DataMapper.setup(:default, 'sqlite:dbs/score.db')

class Address
  include DataMapper::Resource
  storage_names[:default] = 'address'
  
  property :actions, Text
  property :nid_id, Integer, :key => true       
  property :value, Text, :key => true
  property :points, Integer
end

class DateProps
  include DataMapper::Resource
  storage_names[:default] = 'date'
  
  property :nid_id, Integer, :key => true    
  property :value, Text, :key => true
  property :actions, Text
  property :points, Integer
end

class Name
  include DataMapper::Resource
  storage_names[:default] = 'name'

  property :nid_id, Integer, :key => true
  property :value, Text, :key => true
  property :actions, Text
  property :points, Integer
end

class Monuments
  include DataMapper::Resource
  storage_names[:default] = 'monuments'
  
  property :oz_id, Integer
  property :nid_id, Integer, :key => true
  property :touched, Integer
  property :reviewed, Integer
  property :locked, Integer
  property :categories, Text
end

DataMapper.setup(:results, 'sqlite:dbs/results.db')

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
end

DataMapper.finalize
DataMapper.auto_upgrade!

enable :sessions

get '/' do
  puts "GET==============================================="
  @monument = Monuments.first(:touched => 1, :reviewed => 0, :locked.lt => Time.now-(5*60))
  if @monument != nil
    @monument.update(:locked => Time.now)
    @addresses = Address.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    @dates = DateProps.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    @names = Name.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    if @addresses.size < 2 && @dates.size < 2 && @names.size < 2
      name = ""
      name = @names[0].value unless @names[0] == nil
      address = ""
      address = @addresses[0].value unless @addresses[0] == nil
      date = ""
      date = @dates[0].value unless @dates[0] == nil
      if ResultMonuments.create(:oz_id => @monument.oz_id, :nid_id => @monument.nid_id, :touched => @monument.touched, :name => name, :address => address, :date => date, :categories => @monument.categories)
        @monument.update(:reviewed => 1)
      end
      redirect '/', 307
    else
    erb :index
    end
  else
    session[:alert] = "Brak zabytków do sprawdzenia" 
  end
end

get '/:nid_id' do
  @monument = Monuments.first(:nid_id => params[:nid_id])
  if @monument != nil
    @monument.update(:locked => Time.now)
    @addresses = Address.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    @dates = DateProps.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    @names = Name.all(:nid_id => @monument.nid_id, :order => [ :points.desc ])
    erb :index
  else
    session[:alert] = "Nie znaleziono zabytku o podanym nid_id: #{params[:nid_id]}"
  end
end

post '/' do
  puts "PARAMS: #{params}"
  session[:alert] = ""
  session[:notice] = ""
  @monumentToUpdate = Monuments.first(:nid_id => params[:nid_id])
  if @monumentToUpdate != nil
    if ResultMonuments.create(:oz_id => @monumentToUpdate.oz_id, :nid_id => @monumentToUpdate.nid_id, :touched => @monumentToUpdate.touched, :name => params[:name], :address => params[:address], :date => params[:date], :categories => @monumentToUpdate.categories)
      @monumentToUpdate.update(:reviewed => 1)
      session[:notice] = "Wszystko poszło OK (nid: <a href=\"/#{@monumentToUpdate.nid_id}\">#{@monumentToUpdate.nid_id}</a>)"
    else
      session[:alert] = "Coś poszło nie tak (nid: <a href=\"/#{@monumentToUpdate.nid_id}\">#{@monumentToUpdate.nid_id}</a>)"
    end
    redirect to('/')
  else
    session[:alert] = "Nie znaleziono zabytku o podanym nid_id: #{params[:nid_id]}"
  end
end

