//
// Event Response
// Copyright 2026 OutClimb
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// 	http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

package responses

import (
	"encoding/xml"
	"strconv"
	"time"

	"github.com/OutClimb/OutClimb/internal/app/models"
)

const eventsFeedTimezoneName = "America/Chicago"

type EventFeedPublic struct {
	XMLName xml.Name           `xml:"rss"`
	Version string             `xml:"version,attr"`
	Channel eventChannelPublic `xml:"channel"`
}

type eventChannelPublic struct {
	Title       string        `xml:"title"`
	Link        string        `xml:"link"`
	Description string        `xml:"description"`
	Items       []EventPublic `xml:"item"`
}

// cdataContent wraps a string so it marshals as a CDATA section.
type cdataContent struct {
	Inner []byte `xml:",innerxml"`
}

type mediaContentPublic struct {
	URL  string `xml:"url,attr"`
	Type string `xml:"type,attr,omitempty"`

	Description string `xml:"http://www.rssboard.org/media-rss description,omitempty"`
}

type guidPublic struct {
	IsPermaLink bool   `xml:"isPermaLink,attr"`
	Value       string `xml:",chardata"`
}

type EventPublic struct {
	Title          string              `xml:"title"`
	Description    string              `xml:"description"`
	PubDate        string              `xml:"pubDate"`
	GUID           guidPublic          `xml:"guid"`
	ContentEncoded *cdataContent       `xml:"http://purl.org/rss/1.0/modules/content/ encoded"`
	MediaContent   *mediaContentPublic `xml:"http://www.rssboard.org/media-rss content"`
}

func (f *EventFeedPublic) Publicize(feed *models.EventFeedInternal) {
	centralTime, err := time.LoadLocation(eventsFeedTimezoneName)
	if err != nil {
		centralTime = time.UTC
	}

	f.Version = "2.0"
	f.Channel.Title = feed.Title
	f.Channel.Link = feed.Link
	f.Channel.Description = feed.Description
	f.Channel.Items = make([]EventPublic, 0, len(feed.Events))
	for _, event := range feed.Events {
		ep := EventPublic{
			Title:       event.Title,
			Description: event.Excerpt,
			PubDate:     event.StartsAt.In(centralTime).Format(time.RFC1123Z),
			GUID:        guidPublic{Value: "event-" + strconv.FormatUint(uint64(event.ID), 10)},
		}
		if event.BodyHTML != "" {
			ep.ContentEncoded = &cdataContent{Inner: []byte("<![CDATA[" + event.BodyHTML + "]]>")}
		}
		if event.FeaturedImageURL != "" {
			ep.MediaContent = &mediaContentPublic{URL: event.FeaturedImageURL, Type: event.FeaturedImageType, Description: event.FeaturedImageAltText}
		}
		f.Channel.Items = append(f.Channel.Items, ep)
	}
}

type EventRequestPublic struct {
	Title                string    `json:"title"`
	StartsAt             time.Time `json:"startsAt"`
	EndsAt               time.Time `json:"endsAt"`
	LocationID           *uint     `json:"locationId"`
	LocationName         string    `json:"locationName"`
	Address              string    `json:"address"`
	City                 string    `json:"city"`
	State                string    `json:"state"`
	Zip                  string    `json:"zip"`
	FeaturedImageAssetID uint      `json:"featuredImageAssetId"`
	FeaturedImageAltText string    `json:"featuredImageAltText"`
	Excerpt              string    `json:"excerpt"`
	Body                 string    `json:"body"`
}

type eventFeaturedImageResponsePublic struct {
	AssetID uint   `json:"assetId"`
	URL     string `json:"url"`
	AltText string `json:"altText"`
}

type EventResponsePublic struct {
	ID            uint                             `json:"id"`
	Title         string                           `json:"title"`
	StartsAt      time.Time                        `json:"startsAt"`
	EndsAt        time.Time                        `json:"endsAt"`
	LocationID    *uint                            `json:"locationId"`
	LocationName  string                           `json:"locationName"`
	Address       string                           `json:"address"`
	City          string                           `json:"city"`
	State         string                           `json:"state"`
	Zip           string                           `json:"zip"`
	FeaturedImage eventFeaturedImageResponsePublic `json:"featuredImage"`
	Excerpt       string                           `json:"excerpt"`
	Body          string                           `json:"body"`
}

func (e *EventResponsePublic) Publicize(event *models.EventInternal) {
	e.ID = event.ID
	e.Title = event.Title
	e.StartsAt = event.StartsAt
	e.EndsAt = event.EndsAt
	e.LocationID = event.LocationID
	e.LocationName = event.LocationName
	e.Address = event.Address
	e.City = event.City
	e.State = event.State
	e.Zip = event.Zip
	e.FeaturedImage = eventFeaturedImageResponsePublic{
		AssetID: event.FeaturedImageAssetID,
		URL:     event.FeaturedImageURL,
		AltText: event.FeaturedImageAltText,
	}
	e.Excerpt = event.Excerpt
	e.Body = event.Body
}
