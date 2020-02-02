<?php

namespace Drupal\highlightphp\Plugin\Filter;

use Drupal\Component\Utility\Html;
use Drupal\filter\FilterProcessResult;
use Drupal\filter\Plugin\FilterBase;
use Highlight\Highlighter;

/**
 * Highlights <code> tags in HTML.
 *
 * @Filter(
 *   id = "filter_highlightphp",
 *   title = @Translation("Highlight &lt;code&gt; tags in HTML."),
 *   type = Drupal\filter\Plugin\FilterInterface::TYPE_TRANSFORM_IRREVERSIBLE,
 *   weight = 10
 * )
 */
class FilterHighlightPhp extends FilterBase {

  /**
   * {@inheritdoc}
   */
  public function process($text, $langcode) {
    $hl = new Highlighter();
    $hl->setAutodetectLanguages(['html', 'php', 'javascript', 'css', 'twig', 'yaml']);

    $document = Html::load($text);
    $xpath = new \DOMXPath($document);
    $modified = FALSE;

    /** @var \DOMElement $node */
    foreach ($xpath->query('//code') as $node) {
      try {
        $result = $hl->highlightAuto($node->textContent);
        $fragment = $document->createDocumentFragment();
        $fragment->appendXML($result->value);
        $node->textContent = '';
        $node->appendChild($fragment);
        $node->setAttribute('class', "hljs {$result->language}");
        $modified = TRUE;
      }
      catch (\Exception $e) {}
    }

    if ($modified) {
      $result = new FilterProcessResult(Html::serialize($document));
      $result->addAttachments(['library' => ['highlightphp/main']]);
    }
    else {
      $result = new FilterProcessResult($text);
    }

    return $result;
  }

}
